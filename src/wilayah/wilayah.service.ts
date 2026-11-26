import { Injectable } from '@nestjs/common';
import { DAFTAR_WILAYAH_MASTER, WilayahItem } from './wilayah.data';

@Injectable()
export class WilayahService {
  getAll(): WilayahItem[] {
    return DAFTAR_WILAYAH_MASTER;
  }

  getNames(): string[] {
    return DAFTAR_WILAYAH_MASTER.map((item) => item.value);
  }

  getDaerahByWilayah(wilayahValue: string): string[] {
    const match = DAFTAR_WILAYAH_MASTER.find(
      (item) => item.value === wilayahValue || item.label.toLowerCase() === wilayahValue.toLowerCase()
    );
    return match ? match.daerah : [];
  }
}
