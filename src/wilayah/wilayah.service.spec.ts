import { WilayahService } from './wilayah.service';
import { DAFTAR_WILAYAH_MASTER } from './wilayah.data';

describe('WilayahService', () => {
  let service: WilayahService;

  beforeEach(() => {
    service = new WilayahService();
  });

  it('should return all 11 official wilayah', () => {
    const list = service.getAll();
    expect(list).toHaveLength(11);
    expect(list[0].value).toBe('Wilayah Syekh Jumadil Kubro (01)');
    expect(list[1].value).toBe('Wilayah Az-Zainiyah (02)');
    expect(list[10].value).toBe('Wilayah Zaid bin Tsabit Putri (11)');
  });

  it('should return 11 wilayah names', () => {
    const names = service.getNames();
    expect(names).toHaveLength(11);
    expect(names).toContain('Wilayah Syekh Jumadil Kubro (01)');
    expect(names).toContain('Wilayah Zaid bin Tsabit Putri (11)');
  });

  it('should resolve correct authentic daerah for Wilayah Syekh Jumadil Kubro (01)', () => {
    const daerah = service.getDaerahByWilayah('Wilayah Syekh Jumadil Kubro (01)');
    expect(daerah).toContain('Sunan Gunung Jati (A)');
    expect(daerah).toContain('Sunan Kalijaga (G)');
  });
});
