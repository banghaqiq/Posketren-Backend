import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database njpackage...');

  // 1. Seed Operators (Hanya Akun Admin)
  const adminHash = await bcrypt.hash('admin123', 12);

  await prisma.operator.upsert({
    where: { username: 'admin' },
    update: { password_hash: adminHash },
    create: {
      id: 'usr-admin',
      username: 'admin',
      password_hash: adminHash,
      name: 'Ustadz Ulil Albab (Admin)',
      role: 'admin',
      login_attempts: 0,
    },
  });

  console.log('✅ Admin operator seeded');

  // 2. Seed Students
  const studentsData = [
    {
      niup: '02397227',
      nama_lengkap: 'Muhammad Nurul Huda',
      jenis_kelamin: 'Laki-laki',
      wilayah: 'Syekh Jumadil Qubro',
      daerah: 'KH Hasyim Asyari',
    },
    {
      niup: '99887711',
      nama_lengkap: 'Ahmad Fauzan',
      jenis_kelamin: 'Laki-laki',
      wilayah: 'Wilayah Al-Azhar',
      daerah: 'Blok A',
    },
    {
      niup: '11223344',
      nama_lengkap: 'Siti Aminah',
      jenis_kelamin: 'Perempuan',
      wilayah: 'Wilayah Fatimatuz Zahro',
      daerah: 'Kamar 03 / Blok B',
    },
    {
      niup: '55667788',
      nama_lengkap: 'Muhammad Ridwan Syah',
      jenis_kelamin: 'Laki-laki',
      wilayah: 'Wilayah Zaid Bin Tsabit',
      daerah: 'Blok C - Lt. 2',
    },
    {
      niup: '33445566',
      nama_lengkap: 'Aisyah Humaira',
      jenis_kelamin: 'Perempuan',
      wilayah: 'Wilayah Sayyidah Khadijah',
      daerah: 'Kamar 12 / Blok Melati',
    },
  ];

  for (const s of studentsData) {
    await prisma.student.upsert({
      where: { niup: s.niup },
      update: {},
      create: s,
    });
  }
  console.log('✅ Students seeded');

  // 3. Seed API Config
  await prisma.apiConfig.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      baseUrl: 'https://sim.nuruljadid.net/api/v1',
      token: 'nj_token_sync_prod_2026',
      syncFrequency: 'daily',
      lastSyncTime: new Date().toISOString(),
      lastSyncStatus: 'success',
      updatedCount: 15,
      mapping_json: {
        niup_field: 'niup',
        name_field: 'nama_lengkap',
        gender_field: 'jenis_kelamin',
        region_field: 'wilayah',
        dorm_field: 'daerah',
      },
    },
  });

  // 4. Seed Packages
  const packagesData = [
    {
      id: 'PKG-20261026-F8A21B90',
      trackingNumber: 'JT9812739121ID',
      courier: 'J&T Express',
      recipientId: '02397227',
      recipientName: 'Muhammad Nurul Huda',
      asrama: 'Putra' as const,
      wilayah: 'Syekh Jumadil Qubro',
      daerah: 'KH Hasyim Asyari',
      type: 'regular' as const,
      status: 'diterima_petugas',
      dateReceived: '2026-10-26',
      kondisi: 'baik' as const,
      rackLocation: 'Rak A-02 Pos Paket',
      notes: 'Buku kitab & pakaian dari keluarga',
    },
    {
      id: 'JSTP-2610-001',
      trackingNumber: 'GF-908123',
      courier: 'GoFood / GrabFood',
      recipientId: '99887711',
      recipientName: 'Ahmad Fauzan',
      asrama: 'Putra' as const,
      wilayah: 'Wilayah Al-Azhar',
      daerah: 'Blok A',
      type: 'jastip' as const,
      status: 'diterima_petugas',
      dateReceived: '2026-10-26',
      category: 'Makanan Cepat Saji (Hangat)',
      arrivalTime: '14:20 WIB',
      kondisi: 'baik' as const,
      rackLocation: 'Meja Jastip Pos Paket',
      notes: 'Harap segera diambil dalam 24 jam',
    },
    {
      id: 'PKG-20261025-E791C042',
      trackingNumber: 'SPXID048192837',
      courier: 'Shopee Xpress',
      recipientId: '11223344',
      recipientName: 'Siti Aminah',
      asrama: 'Putri' as const,
      wilayah: 'Wilayah Fatimatuz Zahro',
      daerah: 'Kamar 03 / Blok B',
      type: 'regular' as const,
      status: 'diterima_pengurus',
      dateReceived: '2026-10-25',
      kondisi: 'baik' as const,
      rackLocation: 'Lemari Pos Asrama Putri',
      notes: 'Telah diserahkan ke pengurus asrama ustadzah Nadia',
    },
    {
      id: 'PKG-20261024-89AB12CD',
      trackingNumber: 'JNE098273618',
      courier: 'JNE Reguler',
      recipientId: '55667788',
      recipientName: 'Muhammad Ridwan Syah',
      asrama: 'Putra' as const,
      wilayah: 'Wilayah Zaid Bin Tsabit',
      daerah: 'Blok C - Lt. 2',
      type: 'regular' as const,
      status: 'disita',
      dateReceived: '2026-10-24',
      kondisi: 'baik' as const,
      confiscatedReason: 'Elektronik Terlarang',
      confiscatedBy: 'Ust. Hasan Basri',
      confiscatedNotes: 'Ditemukan perangkat MP3 player dan speaker mini tanpa izin pengasuh',
      confiscatedDate: '2026-10-24',
      rackLocation: 'Gudang Sitaan Keamanan',
      notes: 'Menunggu proses pelepasan saat wali santri berkunjung',
    },
    {
      id: 'PKG-20261023-334455AA',
      trackingNumber: 'SICEPAT00998811',
      courier: 'SiCepat Ekspres',
      recipientId: '33445566',
      recipientName: 'Aisyah Humaira',
      asrama: 'Putri' as const,
      wilayah: 'Wilayah Sayyidah Khadijah',
      daerah: 'Kamar 12 / Blok Melati',
      type: 'regular' as const,
      status: 'telah_diantarkan',
      dateReceived: '2026-10-23',
      kondisi: 'baik' as const,
      receiverName: 'Aisyah Humaira (Santri Langsung)',
      receiverTime: '2026-10-24 16:45',
      rackLocation: 'Selesai',
      notes: 'Telah diverifikasi kondisi fisik utuh dan validasi PIN',
    },
    {
      id: 'PKG-20261020-99887766',
      trackingNumber: 'POSID887711223',
      courier: 'Pos Indonesia',
      recipientId: '00000000',
      recipientName: 'Tanpa Nama Jelas',
      asrama: 'Putra' as const,
      wilayah: 'Belum Teridentifikasi',
      daerah: 'Pos Paket Pusat',
      type: 'regular' as const,
      status: 'paket_anonim',
      dateReceived: '2026-10-20',
      kondisi: 'rusak' as const,
      rackLocation: 'Rak Khusus Paket Anonim',
      notes: 'Label resi sobek, tidak ada nomor kontak santri yang bisa dihubungi',
    },
  ];

  for (const pkg of packagesData) {
    await prisma.package.upsert({
      where: { id: pkg.id },
      update: {},
      create: pkg,
    });
  }
  console.log('✅ Packages seeded');

  // 5. Seed Activity Logs
  const logs = [
    {
      type: 'package_in',
      title: 'Penerimaan Paket Reguler',
      description: 'Paket PKG-20261026-F8A21B90 dari J&T Express telah dicatat oleh Petugas Pos',
      timestamp: '2026-10-26T08:30:00.000Z',
      operator: 'Ustadz Ahmad Fauzi',
    },
    {
      type: 'jastip_in',
      title: 'Penerimaan Paket Jastip',
      description: 'Paket titipan makanan JSTP-2610-001 dari GoFood tiba di Pos Paket',
      timestamp: '2026-10-26T14:20:00.000Z',
      operator: 'Ustadz Ahmad Fauzi',
    },
    {
      type: 'confiscation',
      title: 'Penyitaan Barang Terlarang',
      description: 'Paket PKG-20261024-89AB12CD disita oleh Biro Keamanan (Alasan: Elektronik Terlarang)',
      timestamp: '2026-10-24T10:15:00.000Z',
      operator: 'Ust. Hasan Basri',
    },
    {
      type: 'delivery',
      title: 'Serah Terima Paket Selesai',
      description: 'Paket PKG-20261023-334455AA telah diterima langsung oleh Aisyah Humaira',
      timestamp: '2026-10-24T16:45:00.000Z',
      operator: 'Ustadz Ahmad Fauzi',
    },
  ];

  for (const log of logs) {
    await prisma.activityLog.create({
      data: log,
    });
  }
  console.log('✅ Activity logs seeded');

  console.log('🎉 Database njpackage seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
