import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import * as crypto from 'crypto';
import { validateBase64Image } from '../common/security.util';

@Injectable()
export class PackagesService {
  constructor(private prisma: PrismaService) {}

  private async generatePackageId(type: 'regular' | 'jastip' = 'regular'): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const yy = String(year).slice(-2);

    if (type === 'jastip') {
      const prefix = `JSTP-${yy}${month}-`;
      // Count existing jastip in this month
      const count = await this.prisma.package.count({
        where: {
          type: 'jastip',
          id: {
            startsWith: prefix,
          },
        },
      });
      const nextNum = String(count + 1).padStart(3, '0');
      return `${prefix}${nextNum}`;
    } else {
      // Reguler: PKG-YYYYMMDD-XXXXXXXX
      const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
      return `PKG-${year}${month}${day}-${randomHex}`;
    }
  }

  async findAll(query?: {
    search?: string;
    status?: string;
    type?: string;
    courier?: string;
    page?: number;
    limit?: number;
    isPublic?: boolean;
    securityWilayah?: string | null;
    wilayah?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const {
      search,
      status,
      type,
      courier,
      page,
      limit,
      isPublic,
      securityWilayah,
      wilayah,
      startDate,
      endDate,
    } = query || {};

    const where: any = {};

    if (status && status !== 'all') {
      where.status = status;
    }

    if (type && type !== 'all') {
      where.type = type;
    }

    if (courier && courier !== 'all') {
      where.courier = courier;
    }

    // Pembatasan wilayah khusus operator keamanan
    if (securityWilayah !== null && securityWilayah !== undefined) {
      where.wilayah = securityWilayah;
    } else if (wilayah && wilayah !== 'all') {
      where.wilayah = wilayah;
    }

    // Filter tanggal berdasarkan waktu paket dibuat (created_at)
    if (startDate || endDate) {
      where.created_at = {};

      if (startDate) {
        where.created_at.gte = new Date(`${startDate}T00:00:00+07:00`);
      }

      if (endDate) {
        const nextDay = new Date(`${endDate}T00:00:00+07:00`);
        nextDay.setDate(nextDay.getDate() + 1);

        where.created_at.lt = nextDay;
      }
    }

    if (search && search.trim() !== '') {
      const s = search.trim();
      where.OR = [
        { id: { contains: s } },
        { trackingNumber: { contains: s } },
        { recipientName: { contains: s } },
        { recipientId: { contains: s } },
        { wilayah: { contains: s } },
        { daerah: { contains: s } },
      ];
    }

    // Enforce safe pagination bounds to prevent DoS via excessive memory allocation
    const safeLimit = Math.min(Math.max(Number(limit) || 200, 1), 500);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const packages = await this.prisma.package.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: safeLimit,
      skip,
      include: {
        manifest: true,
      },
    });

    if (isPublic) {
      // Strip internal notes, evidence URLs, and mask sensitive recipient IDs for public tracking
      return packages.map((pkg) => ({
        id: pkg.id,
        trackingNumber: pkg.trackingNumber,
        courier: pkg.courier,
        recipientName: pkg.recipientName,
        recipientId: pkg.recipientId ? `${pkg.recipientId.slice(0, 3)}***` : '',
        asrama: pkg.asrama,
        wilayah: pkg.wilayah,
        daerah: pkg.daerah,
        type: pkg.type,
        status: pkg.status,
        dateReceived: pkg.dateReceived,
        kondisi: pkg.kondisi,
        receiverName: pkg.receiverName,
        receiverTime: pkg.receiverTime,
        created_at: pkg.created_at,
        manifest: pkg.manifest,
      }));
    }

    return packages;
  }

  
async findOne(id: string) {
  const searchId = id.trim();

  // 1. Cari berdasarkan ID internal database
  let pkg = await this.prisma.package.findUnique({
    where: { id: searchId },
    include: {
      manifest: true,
    },
  });

  // 2. Jika tidak ditemukan, coba cari berdasarkan nomor resi kurir
  if (!pkg) {
    pkg = await this.prisma.package.findFirst({
      where: {
        trackingNumber: {
          equals: searchId,
          mode: 'insensitive',
        },
      },
      include: {
        manifest: true,
      },
    });
  }

  // 3. Jika tetap tidak ditemukan
  if (!pkg) {
    throw new NotFoundException(
      `Paket dengan ID atau nomor resi '${searchId}' tidak ditemukan`,
    );
  }

    return pkg;
  }


  async create(dto: CreatePackageDto, operatorName: string = 'Petugas Pos') {
    const pkgType = dto.type || 'regular';
    const cleanTracking = (dto.trackingNumber || '').trim();

    // 1. Cek apakah nomor resi sudah terdaftar
    if (cleanTracking) {
      const existing = await this.prisma.package.findFirst({
        where: {
          trackingNumber: {
            equals: cleanTracking,
            mode: 'insensitive',
          },
        },
      });

      if (existing) {
        throw new BadRequestException(
          `Nomor resi "${cleanTracking}" sudah terdaftar pada paket ${existing.id}. Hapus paket tersebut terlebih dahulu jika ingin menggunakan resi ini kembali.`,
        );
      }
    }


    // 2. Jika paket baru (belum ada resi yang sama), buat data baru
    const pkgId = dto.id && dto.id.trim() !== ''
      ? dto.id.trim()
      : await this.generatePackageId(pkgType);

    const created = await this.prisma.package.create({
      data: {
        id: pkgId,
        trackingNumber: cleanTracking,
        courier: dto.courier || 'J&T Express',
        recipientId: dto.recipientId,
        recipientName: dto.recipientName,
        asrama: dto.asrama,
        wilayah: dto.wilayah,
        daerah: dto.daerah,
        room: dto.room || null,
        type: pkgType,
        status: dto.status || 'diterima_petugas',
        dateReceived: dto.dateReceived || new Date().toISOString().slice(0, 10),
        kondisi: dto.kondisi || 'baik',
        notes: dto.notes || null,
        category: dto.category || null,
        arrivalTime: dto.arrivalTime || (pkgType === 'jastip' ? new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : null),
        isExternalRecipient: dto.isExternalRecipient || false,
        manualRecipientName: dto.manualRecipientName || null,
        rackLocation: dto.rackLocation || 'Pos Paket',
      },
    });

    // Record activity log
    try {
      await this.prisma.activityLog.create({
        data: {
          type: pkgType === 'jastip' ? 'jastip_in' : 'package_in',
          title: pkgType === 'jastip' ? 'Paket Jastip Masuk' : 'Paket Reguler Masuk',
          description: `Paket ${created.id} (${created.courier} - ${created.trackingNumber}) untuk ${created.recipientName} tercatat di Pos Paket`,
          timestamp: new Date().toISOString(),
          operator: operatorName,
        },
      });
    } catch (e) {}

    return created;
  }

  async bulkCreate(packages: CreatePackageDto[], operatorName: string = 'Petugas Pos') {
    const results: any[] = [];
    for (const pkg of packages) {
      if (!pkg.trackingNumber) continue;
      const created = await this.create(pkg, operatorName);
      results.push(created);
    }

    try {
      await this.prisma.activityLog.create({
        data: {
          type: 'package_in',
          title: 'Input Massal Paket Masuk',
          description: `Sebanyak ${results.length} paket baru berhasil diinput massal ke sistem`,
          timestamp: new Date().toISOString(),
          operator: operatorName,
        },
      });
    } catch (e) {}

    return results;
  }

  async update(id: string, dto: UpdatePackageDto, operatorName: string = 'Petugas Pos') {
    const existing = await this.findOne(id);

    // Validasi ketat kepatuhan SOP Pesantren: Wajib lampirkan foto bukti serah terima untuk Keluarga Pengasuh
    const recipientLower = (existing.recipientName || '').toLowerCase();
    const wilayahLower = (existing.wilayah || '').toLowerCase();
    const isPengasuh =
      recipientLower.includes('keluarga pengasuh') ||
      recipientLower.includes('dalem') ||
      recipientLower.includes('kasepuhan') ||
      recipientLower.includes('pengasuh') ||
      recipientLower.includes('dzurriyah') ||
      wilayahLower.includes('pengasuh') ||
      wilayahLower.includes('dzurriyah') ||
      wilayahLower.includes('kasepuhan') ||
      wilayahLower.includes('dalem');

    if (
      isPengasuh &&
      (dto.status === 'telah_diantarkan' || dto.status === 'telah_diterima') &&
      !existing.proof_image
    ) {
      throw new BadRequestException(
        'Wajib melampirkan foto bukti fisik serah terima sebelum menyelesaikan paket untuk Keluarga Pengasuh (Dalem Kasepuhan).'
      );
    }

    const updated = await this.prisma.package.update({
      where: { id },
      data: {
        status: dto.status,
        kondisi: dto.kondisi !== undefined ? dto.kondisi : existing.kondisi,
        confiscatedReason: dto.confiscatedReason !== undefined ? dto.confiscatedReason : existing.confiscatedReason,
        confiscatedNotes: dto.confiscatedNotes !== undefined ? dto.confiscatedNotes : existing.confiscatedNotes,
        confiscatedBy: dto.confiscatedBy !== undefined ? dto.confiscatedBy : existing.confiscatedBy,
        confiscatedDate: dto.confiscatedDate !== undefined ? dto.confiscatedDate : existing.confiscatedDate,
        confiscatedEvidenceUrl: dto.confiscatedEvidenceUrl !== undefined ? dto.confiscatedEvidenceUrl : existing.confiscatedEvidenceUrl,
        returnCourier: dto.returnCourier !== undefined ? dto.returnCourier : existing.returnCourier,
        returnTrackingNumber: dto.returnTrackingNumber !== undefined ? dto.returnTrackingNumber : existing.returnTrackingNumber,
        returnProofUrl: dto.returnProofUrl !== undefined ? dto.returnProofUrl : existing.returnProofUrl,
        receiverName: dto.receiverName !== undefined ? dto.receiverName : existing.receiverName,
        receiverTime: dto.receiverTime !== undefined ? dto.receiverTime : existing.receiverTime,
        rackLocation: dto.rackLocation !== undefined ? dto.rackLocation : existing.rackLocation,
        notes: dto.notes !== undefined ? dto.notes : existing.notes,
      },
    });

    // Record activity log on status change
    if (existing.status !== dto.status) {
      let logTitle = `Perubahan Status Paket ${id}`;
      let logType = 'status_update';

      if (dto.status === 'telah_diantarkan' || dto.status === 'telah_diterima') {
        logTitle = `Paket ${id} Diserahkan ke Penerima`;
        logType = 'delivery';
      } else if (dto.status === 'disita') {
        logTitle = `Paket ${id} Disita oleh Keamanan`;
        logType = 'confiscation';
      } else if (dto.status === 'dikembalikan') {
        logTitle = `Paket ${id} Diproses Pengembalian (RTS)`;
        logType = 'rts';
      } else if (dto.status === 'diterima_pengurus') {
        logTitle = `Paket ${id} Didistribusikan ke Asrama`;
        logType = 'transfer';
      }

      try {
        await this.prisma.activityLog.create({
          data: {
            type: logType,
            title: logTitle,
            description: `Status diubah dari '${existing.status}' menjadi '${dto.status}'. Penerima: ${dto.receiverName || existing.recipientName}`,
            timestamp: new Date().toISOString(),
            operator: operatorName,
          },
        });
      } catch (e) {}
    }

    return updated;
  }

  async remove(id: string, operatorName: string = 'Admin') {
    const existing = await this.findOne(id);
    await this.prisma.package.delete({
      where: { id },
    });

    try {
      await this.prisma.activityLog.create({
        data: {
          type: 'package_delete',
          title: `Penghapusan Paket ${id}`,
          description: `Paket ${id} (${existing.trackingNumber}) telah dihapus dari sistem`,
          timestamp: new Date().toISOString(),
          operator: operatorName,
        },
      });
    } catch (e) {}

    return { success: true, message: `Paket ${id} berhasil dihapus` };
  }

  async saveProof(id: string, imageData: string, mimeType: string = 'image/webp') {
    await this.findOne(id);
    const validated = validateBase64Image(imageData, 2 * 1024 * 1024, 'Foto Bukti');

    return this.prisma.package.update({
      where: { id },
      data: {
        proof_image: imageData,
        proof_image_mimetype: validated.mimeType,
      },
    });
  }

  async getProof(id: string) {
    const pkg = await this.findOne(id);
    if (!pkg.proof_image) {
      throw new NotFoundException('Foto bukti tidak ditemukan');
    }
    return {
      imageData: pkg.proof_image,
      mimeType: pkg.proof_image_mimetype || 'image/jpeg',
    };
  }

  async deleteProof(id: string) {
    await this.findOne(id);
    return this.prisma.package.update({
      where: { id },
      data: {
        proof_image: null,
        proof_image_mimetype: null,
      },
    });
  }
}
