import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ManifestsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.manifest.findMany({
      include: {
        packageRef: true,
        packages: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async create(data: {
    packageId?: string;
    packageIds?: string[];
    notes?: string;
    rackLocation?: string;
    status?: string;
  }) {
    const manifestId = `MNF-${Date.now().toString().slice(-6)}`;

    // Create manifest
    const manifest = await this.prisma.manifest.create({
      data: {
        id: manifestId,
        packageId: data.packageId || null,
        status: data.status || 'diterima_petugas',
        rackLocation: data.rackLocation || 'Pos Paket',
        notes: data.notes || null,
      },
    });

    // If multiple package IDs are provided, link them
    if (data.packageIds && data.packageIds.length > 0) {
      await this.prisma.package.updateMany({
        where: { id: { in: data.packageIds } },
        data: { manifestId: manifest.id },
      });
    }

    return this.prisma.manifest.findUnique({
      where: { id: manifest.id },
      include: {
        packageRef: true,
        packages: true,
      },
    });
  }
}
