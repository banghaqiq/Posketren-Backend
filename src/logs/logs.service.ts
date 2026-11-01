import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async findAll(page: number = 1, limit: number = 20, type?: string) {
    const skip = (Math.max(1, page) - 1) * limit;
    const where: any = {};
    if (type && type !== 'all') {
      where.type = type;
    }

    const [logs, total] = await Promise.all([
      this.prisma.activityLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async create(data: {
    type: string;
    title: string;
    description: string;
    operator: string;
    timestamp?: string;
  }) {
    return this.prisma.activityLog.create({
      data: {
        type: data.type,
        title: data.title,
        description: data.description,
        operator: data.operator,
        timestamp: data.timestamp || new Date().toISOString(),
      },
    });
  }

  async cleanup(days?: number, all?: boolean) {
    if (all) {
      const res = await this.prisma.activityLog.deleteMany({});
      return {
        success: true,
        count: res.count,
        message: 'Seluruh catatan aktivitas berhasil dibersihkan',
      };
    }
    const cutoffDays = days || 7;
    const cutoffDate = new Date(Date.now() - cutoffDays * 24 * 60 * 60 * 1000);
    const res = await this.prisma.activityLog.deleteMany({
      where: {
        created_at: {
          lt: cutoffDate,
        },
      },
    });
    return {
      success: true,
      count: res.count,
      message: `Catatan aktivitas yang lebih lama dari ${cutoffDays} hari (${res.count} data) berhasil dibersihkan`,
    };
  }
}
