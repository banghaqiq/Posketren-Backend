import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

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

    if (operator.locked_until && operator.locked_until > now) {
      const waitMinutes = Math.ceil(
        (operator.locked_until.getTime() - now.getTime()) / 60000,
      );

      throw new HttpException(
        `Akun sedang tertahan selama ${waitMinutes} menit karena 5 kali salah kata sandi. Silakan coba lagi nanti.`,
        HttpStatus.FORBIDDEN,
      );
    }

    let isMatch = await bcrypt.compare(pass, operator.password_hash);

    if (!isMatch && pass.trim() !== pass) {
      isMatch = await bcrypt.compare(pass.trim(), operator.password_hash);
    }

    if (!isMatch) {
      const isLockExpired =
        operator.locked_until && operator.locked_until <= now;

      const newAttempts = isLockExpired ? 1 : operator.login_attempts + 1;
      let lockedUntil: Date | null = null;

      if (newAttempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
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
          'Login anda tertahan selama 15 menit karena gagal login 5 kali berturut-turut.',
          HttpStatus.FORBIDDEN,
        );
      }

      throw new UnauthorizedException('Username atau kata sandi salah');
    }

    // Buat identitas sesi unik untuk perangkat ini.
    const sessionId = randomUUID();
    const sessionExpiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);

    const payload = {
      sub: operator.id,
      id: operator.id,
      username: operator.username,
      name: operator.name,
      role: operator.role,
      sessionId,
    };

    // Token dibuat sebelum klaim sesi, tetapi belum dikirim ke perangkat.
    const token = await this.jwtService.signAsync(payload);

    // Klaim sesi secara atomik.
    // Sesi lama hanya bisa digantikan jika sudah kedaluwarsa.
    const claimed = await this.prisma.operator.updateMany({
      where: {
        id: operator.id,
        OR: [
          { active_session_id: null },
          { session_expires_at: null },
          { session_expires_at: { lte: now } },
        ],
      },
      data: {
        active_session_id: sessionId,
        session_expires_at: sessionExpiresAt,
      },
    });

    if (claimed.count === 0) {
      throw new ConflictException(
        'Akun ini sedang aktif di perangkat lain. Silakan logout dari perangkat tersebut terlebih dahulu.',
      );
    }

    // Jika proses setelah klaim gagal, lepaskan sesi yang baru diklaim.
    try {
      await this.prisma.operator.update({
        where: { id: operator.id },
        data: {
          login_attempts: 0,
          locked_until: null,
        },
      });
    } catch (error) {
      await this.prisma.operator.updateMany({
        where: {
          id: operator.id,
          active_session_id: sessionId,
        },
        data: {
          active_session_id: null,
          session_expires_at: null,
        },
      });

      throw error;
    }

    // Catat aktivitas login (tidak memblokir login jika log gagal).
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

  // Lepaskan hanya sesi yang token-nya sesuai.
  async releaseSession(token?: string) {
    if (!token) return;

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        ignoreExpiration: true,
      });

      const userId = payload.id || payload.sub;
      const sessionId = payload.sessionId;

      if (!userId || !sessionId) return;

      await this.prisma.operator.updateMany({
        where: {
          id: userId,
          active_session_id: sessionId,
        },
        data: {
          active_session_id: null,
          session_expires_at: null,
        },
      });
    } catch (error) {
      // Token tidak valid atau sudah tidak sesuai: tidak mengubah sesi lain.
    }
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
