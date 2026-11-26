import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

export async function verifyTokenAndSession(
  token: string,
  jwtService: JwtService,
  prisma: PrismaService,
) {
  const payload = await jwtService.verifyAsync(token);
  const userId = payload.id || payload.sub;
  const sessionId = payload.sessionId;

  if (!userId || !sessionId) {
    throw new UnauthorizedException('Identitas sesi tidak valid');
  }

  const operator = await prisma.operator.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      wilayah: true,
      photo: true,
      locked_until: true,
      active_session_id: true,
      session_expires_at: true,
    },
  });

  if (!operator) {
    throw new UnauthorizedException(
      'Akun pengguna tidak ditemukan atau telah dinonaktifkan',
    );
  }

  // Pastikan token berasal dari sesi perangkat yang masih aktif.
  if (
    operator.active_session_id !== sessionId ||
    !operator.session_expires_at ||
    operator.session_expires_at <= new Date()
  ) {
    throw new UnauthorizedException(
      'Sesi ini sudah berakhir atau telah digantikan. Silakan login kembali.',
    );
  }

  if (operator.locked_until && operator.locked_until > new Date()) {
    throw new UnauthorizedException(
      'Akun sedang terkunci karena keamanan',
    );
  }

  return {
    id: operator.id,
    username: operator.username,
    name: operator.name,
    role: operator.role,
    wilayah: operator.wilayah,
    photo: operator.photo,
  };
}

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
      request['user'] = await verifyTokenAndSession(
        token,
        this.jwtService,
        this.prisma,
      );

      return true;
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;

      throw new UnauthorizedException('Token tidak valid atau kedaluwarsa');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] =
      request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' ? token : undefined;
  }
}
