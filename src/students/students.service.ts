import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where: any = {};
    if (search && search.trim() !== '') {
      const s = search.trim();
      where.OR = [
        { niup: { contains: s } },
        { nama_lengkap: { contains: s } },
        { wilayah: { contains: s } },
        { daerah: { contains: s } },
      ];
    }
    return this.prisma.student.findMany({
      where,
      orderBy: { nama_lengkap: 'asc' },
    });
  }

  async findOne(niup: string) {
    const student = await this.prisma.student.findUnique({
      where: { niup },
    });
    if (!student) {
      throw new NotFoundException(`Santri dengan NIUP '${niup}' tidak ditemukan`);
    }
    return student;
  }

  async create(dto: CreateStudentDto) {
    const cleanNiup = String(dto.niup).trim();
    // Jika data santri sudah terdaftar (double), perbarui data yang ada agar tidak duplikat
    return this.prisma.student.upsert({
      where: { niup: cleanNiup },
      update: {
        nama_lengkap: String(dto.nama_lengkap).trim(),
        jenis_kelamin: dto.jenis_kelamin || 'Laki-laki',
        daerah: dto.daerah ? String(dto.daerah).trim() : 'Pusat',
        wilayah: dto.wilayah ? String(dto.wilayah).trim() : 'Pusat',
      },
      create: {
        niup: cleanNiup,
        nama_lengkap: String(dto.nama_lengkap).trim(),
        jenis_kelamin: dto.jenis_kelamin || 'Laki-laki',
        daerah: dto.daerah ? String(dto.daerah).trim() : 'Pusat',
        wilayah: dto.wilayah ? String(dto.wilayah).trim() : 'Pusat',
      },
    });
  }

  async update(niup: string, dto: UpdateStudentDto) {
    await this.findOne(niup);
    return this.prisma.student.update({
      where: { niup },
      data: {
        nama_lengkap: dto.nama_lengkap,
        jenis_kelamin: dto.jenis_kelamin,
        daerah: dto.daerah,
        wilayah: dto.wilayah,
      },
    });
  }

  async bulkUpsert(students: CreateStudentDto[]) {
    let processed = 0;
    for (const s of students) {
      if (!s.niup || !s.nama_lengkap) continue;
      await this.prisma.student.upsert({
        where: { niup: String(s.niup).trim() },
        update: {
          nama_lengkap: String(s.nama_lengkap).trim(),
          jenis_kelamin: s.jenis_kelamin || 'Laki-laki',
          wilayah: s.wilayah ? String(s.wilayah).trim() : 'Pusat',
          daerah: s.daerah ? String(s.daerah).trim() : 'Pusat',
        },
        create: {
          niup: String(s.niup).trim(),
          nama_lengkap: String(s.nama_lengkap).trim(),
          jenis_kelamin: s.jenis_kelamin || 'Laki-laki',
          wilayah: s.wilayah ? String(s.wilayah).trim() : 'Pusat',
          daerah: s.daerah ? String(s.daerah).trim() : 'Pusat',
        },
      });
      processed++;
    }
    return { success: true, count: processed };
  }

  async remove(niup: string) {
    await this.findOne(niup);
    await this.prisma.student.delete({
      where: { niup },
    });
    return { success: true, message: `Santri dengan NIUP '${niup}' berhasil dihapus` };
  }
}
