// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
//   async onModuleInit() {
//     await this.$connect();
//   }

//   async onModuleDestroy() {
//     await this.$disconnect();
//   }
// }


import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';

import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Menginisialisasi koneksi database PostgreSQL...');

    try {
      await this.$connect();

      this.logger.log('Koneksi database berhasil!');
    } catch (error) {
      this.logger.error(
        'Gagal menghubungkan ke database PostgreSQL.',
        error instanceof Error ? error.stack : String(error),
      );

      throw error;
    }
  }

  async onModuleDestroy() {
    this.logger.log('Memutuskan koneksi database...');

    await this.$disconnect();

    this.logger.log('Koneksi database terputus.');
  }
}
