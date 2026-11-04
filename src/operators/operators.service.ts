import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import * as bcrypt from 'bcryptjs';
import { validateBase64Image } from '../common/security.util';

@Injectable()
export class OperatorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.operator.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        wilayah: true,
        photo: true,
        login_attempts: true,
        locked_until: true,
        created_at: true,
        },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const operator = await this.prisma.operator.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        wilayah: true,
        photo: true,
        login_attempts: true,
        locked_until: true,
        created_at: true,
      },
    });
    if (!operator) throw new NotFoundException('Operator tidak ditemukan');
    return operator;
  }

  async create(dto: CreateOperatorDto) {
    const cleanUsername = dto.username.trim().toLowerCase();
    const existing = await this.prisma.operator.findUnique({
      where: { username: cleanUsername },
    });
    if (existing) {
      throw new ConflictException(`Username '${cleanUsername}' sudah digunakan`);
    }

    const password_hash = await bcrypt.hash(dto.password.trim(), 12);

    let photoData: string | null = null;
    if (dto.photo && dto.photo.trim() !== '') {
      validateBase64Image(dto.photo, 1.5 * 1024 * 1024, 'Foto Profil');
      photoData = dto.photo;
    }

    return this.prisma.operator.create({
      data: {
        username: cleanUsername,
        password_hash,
        name: dto.name.trim(),
        role: dto.role,
        wilayah: dto.wilayah?.trim() || null,
        photo: photoData,
        login_attempts: 0,
        locked_until: null,
      },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        wilayah: true,
        photo: true,
        created_at: true,
      },
    });
  }

  async update(id: string, dto: UpdateOperatorDto) {
    const existing = await this.prisma.operator.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Operator tidak ditemukan');

    const data: any = {
      // Whenever an operator profile/password is updated, reset any lockouts
      login_attempts: 0,
      locked_until: null,
    };

    if (dto.username) {
      const cleanUsername = dto.username.trim().toLowerCase();
      if (cleanUsername !== existing.username) {
        const conflict = await this.prisma.operator.findUnique({ where: { username: cleanUsername } });
        if (conflict) {
          throw new ConflictException(`Username '${cleanUsername}' sudah digunakan`);
        }
      }
      data.username = cleanUsername;
    }

    if (dto.name) data.name = dto.name.trim();
    if (dto.role) data.role = dto.role;

    if (dto.wilayah !== undefined) {
      data.wilayah = dto.wilayah.trim() || null;
    }

    if (dto.photo !== undefined) {
      if (dto.photo && dto.photo.trim() !== '') {
        validateBase64Image(dto.photo, 1.5 * 1024 * 1024, 'Foto Profil');
        data.photo = dto.photo;
      } else {
        data.photo = null;
      }
    }

    if (dto.password && dto.password.trim() !== '') {
      data.password_hash = await bcrypt.hash(dto.password.trim(), 12);
    }

    return this.prisma.operator.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        wilayah: true,
        photo: true,
        created_at: true,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.operator.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Operator tidak ditemukan');

    // Protect primary admin from deletion
    if (existing.username === 'admin') {
      throw new BadRequestException('Akun Administrator utama tidak dapat dihapus');
    }

    await this.prisma.operator.delete({ where: { id } });
    return { success: true, message: `Petugas '${existing.name}' berhasil dihapus` };
  }

  async unlock(id: string) {
    const operator = await this.prisma.operator.findUnique({ where: { id } });
    if (!operator) throw new NotFoundException('Operator tidak ditemukan');

    return this.prisma.operator.update({
      where: { id },
      data: {
        login_attempts: 0,
        locked_until: null,
      },
    });
  }
}
