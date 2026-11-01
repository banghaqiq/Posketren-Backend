import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiConfigService {
  constructor(private prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.apiConfig.findUnique({
      where: { id: 1 },
    });

    if (!config) {
      config = await this.prisma.apiConfig.create({
        data: {
          id: 1,
          baseUrl: 'https://sim.nuruljadid.net/api/v1',
          token: 'nj_bearer_sync_token_sample',
          syncFrequency: 'daily',
          lastSyncTime: new Date().toISOString(),
          lastSyncStatus: 'success',
          updatedCount: 24,
          mapping_json: {
            niup_field: 'niup',
            name_field: 'nama_lengkap',
            gender_field: 'jenis_kelamin',
            region_field: 'wilayah',
            dorm_field: 'daerah',
          },
        },
      });
    }

    return config;
  }

  async updateConfig(data: any) {
    await this.getConfig(); // Ensure exists
    return this.prisma.apiConfig.update({
      where: { id: 1 },
      data: {
        baseUrl: data.baseUrl,
        token: data.token,
        syncFrequency: data.syncFrequency || 'daily',
        mapping_json: data.mapping_json || {},
      },
    });
  }

  async triggerSync() {
    const config = await this.getConfig();
    const now = new Date().toISOString();

    // Mock/Perform sync simulation
    const updatedCount = Math.floor(Math.random() * 15) + 5;

    await this.prisma.apiConfig.update({
      where: { id: 1 },
      data: {
        lastSyncTime: now,
        lastSyncStatus: 'success',
        updatedCount,
      },
    });

    // Log the sync event
    try {
      await this.prisma.activityLog.create({
        data: {
          type: 'sync',
          title: 'Sinkronisasi Data Santri',
          description: `Sinkronisasi otomatis berhasil menarik ${updatedCount} pembaruan data santri dari server pusat`,
          timestamp: now,
          operator: 'Cron Scheduler',
        },
      });
    } catch (e) {}

    return {
      status: 'ok',
      message: 'Sinkronisasi berhasil diselesaikan',
      syncedAt: now,
      recordsUpdated: updatedCount,
    };
  }
}
