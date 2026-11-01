import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string, _ip?: string) {
    const cleanUsername = (username || '').trim().toLowerCase();
    if (!cleanUsername || !pass) {
      throw new UnauthorizedException('Username dan kata sandi wajib diisi');
    }

    const operator = await this.prisma.operator.findUnique({
      where: { username: cleanUsername },
    });

    if (!operator) {
      throw new UnauthorizedException('Username atau kata sandi tidak valid');
    }

    const now = new Date();

    // 1. Periksa apakah akun SPESIFIK ini sedang tertahan (locked_until aktif)
    if (operator.locked_until && operator.locked_until > now) {
      const waitMinutes = Math.ceil(
        (operator.locked_until.getTime() - now.getTime()) / 60000,
      );
      throw new HttpException(
        `Akun '${operator.username}' sedang tertahan selama ${waitMinutes} menit karena 5 kali salah kata sandi. Akun lain tetap dapat login seperti biasa.`,
        HttpStatus.FORBIDDEN,
      );
    }

    // 2. Verifikasi kata sandi dengan bcrypt (mendukung trim jika keyboard menambahkan spasi tak sengaja)
    let isMatch = await bcrypt.compare(pass, operator.password_hash);
    if (!isMatch && pass.trim() !== pass) {
      isMatch = await bcrypt.compare(pass.trim(), operator.password_hash);
    }
    if (!isMatch) {
      // Jika masa lock 15 menit sebelumnya sudah lewat, reset counter ke 1
      const isLockExpired = operator.locked_until && operator.locked_until <= now;
      const newAttempts = isLockExpired ? 1 : operator.login_attempts + 1;
      let lockedUntil: Date | null = null;

      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // Tertahan 15 menit
      }

      await this.prisma.operator.update({
        where: { id: operator.id },
        data: {
          login_attempts: newAttempts,
          locked_until: lockedUntil,
        },
      });

      if (newAttempts >= 5) {
        throw new HttpException(
          `Akun '${operator.username}' tertahan selama 15 menit karena gagal login 5 kali berturut-turut. Akun lain tidak terpengaruh.`,
          HttpStatus.FORBIDDEN,
        );
      }

      const sisa = 5 - newAttempts;
      throw new UnauthorizedException(
        `Kata sandi salah. Percobaan gagal ${newAttempts}/5 untuk akun '${operator.username}' (tersisa ${sisa}x sebelum akun ini tertahan 15 menit).`,
      );
    }

    // 3. Reset status login saat berhasil masuk
    await this.prisma.operator.update({
      where: { id: operator.id },
      data: {
        login_attempts: 0,
        locked_until: null,
      },
    });

    // Record activity log
    try {
      await this.prisma.activityLog.create({
        data: {
          type: 'login',
          title: 'Petugas Masuk Sistem',
          description: `${operator.name} (${operator.role}) berhasil masuk ke sistem`,
          timestamp: new Date().toISOString(),
          operator: operator.name,
        },
      });
    } catch (e) {
      // Non-blocking log
    }

    // JWT payload strictly contains minimal claims to prevent cookie overflow & RFC 6265 header limits
    const payload = {
      sub: operator.id,
      id: operator.id,
      username: operator.username,
      name: operator.name,
      role: operator.role,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      token,
      user: {
        id: operator.id,
        username: operator.username,
        name: operator.name,
        role: operator.role,
        photo: operator.photo,
      },
    };
  }

  async getProfile(userId: string) {
    const operator = await this.prisma.operator.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        photo: true,
        created_at: true,
      },
    });

    if (!operator) {
      throw new UnauthorizedException('Pengguna tidak ditemukan');
    }

    return operator;
  }
}
