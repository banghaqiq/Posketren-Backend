import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = new Date().toISOString().slice(0, 10);

    const [
      totalPackages,
      regularCount,
      jastipCount,
      petugasCount,
      pengurusCount,
      deliveredCount,
      confiscatedCount,
      expiredCount,
      returnedCount,
      anonymousCount,
      todayIncoming,
      recentPackages,
      recentLogs,
      studentCount,
      operatorCount,
    ] = await Promise.all([
      this.prisma.package.count(),
      this.prisma.package.count({ where: { type: 'regular' } }),
      this.prisma.package.count({ where: { type: 'jastip' } }),
      this.prisma.package.count({ where: { status: 'diterima_petugas' } }),
      this.prisma.package.count({ where: { status: 'diterima_pengurus' } }),
      this.prisma.package.count({
        where: {
          OR: [{ status: 'telah_diantarkan' }, { status: 'telah_diterima' }],
        },
      }),
      this.prisma.package.count({ where: { status: 'disita' } }),
      this.prisma.package.count({ where: { status: 'kadaluarsa' } }),
      this.prisma.package.count({ where: { status: 'dikembalikan' } }),
      this.prisma.package.count({ where: { status: 'paket_anonim' } }),
      this.prisma.package.count({
        where: {
          OR: [
            { created_at: { gte: today } },
            { dateReceived: todayStr },
          ],
        },
      }),
      this.prisma.package.findMany({
        take: 8,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.activityLog.findMany({
        take: 8,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.student.count(),
      this.prisma.operator.count(),
    ]);

    // Active packages waiting distribution or pickup
    const activePackages = petugasCount + pengurusCount;

    return {
      kpi: {
        totalPackages,
        todayIncoming,
        activePackages,
        inPos: petugasCount,
        inAsrama: pengurusCount,
        delivered: deliveredCount,
        confiscated: confiscatedCount,
        expired: expiredCount,
        returnedRts: returnedCount,
        anonymous: anonymousCount,
        regular: regularCount,
        jastip: jastipCount,
        totalStudents: studentCount,
        totalOperators: operatorCount,
      },
      statusDistribution: {
        diterima_petugas: petugasCount,
        diterima_pengurus: pengurusCount,
        telah_diantarkan: deliveredCount,
        disita: confiscatedCount,
        kadaluarsa: expiredCount,
        dikembalikan: returnedCount,
        paket_anonim: anonymousCount,
      },
      recentPackages,
      recentLogs,
    };
  }
}
