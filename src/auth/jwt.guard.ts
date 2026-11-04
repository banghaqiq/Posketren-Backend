import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token =
      request.cookies?.['access_token'] ||
      this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Sesi tidak ditemukan atau kedaluwarsa');
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.id || payload.sub;

      const operator = await this.prisma.operator.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          name: true,
          role: true,
          wilayah: true,
          photo: true,
          locked_until: true,
        },
      });

      if (!operator) {
        throw new UnauthorizedException('Akun pengguna tidak ditemukan atau telah dinonaktifkan');
      }

      if (operator.locked_until && operator.locked_until > new Date()) {
        throw new UnauthorizedException('Akun sedang terkunci karena keamanan');
      }

      request['user'] = operator;
      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException('Token tidak valid atau kedaluwarsa');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
