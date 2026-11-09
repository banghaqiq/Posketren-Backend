import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
} from 'class-validator';

export const VALID_PACKAGE_STATUSES = [
  'diterima_petugas',
  'diterima_pengurus',
  'telah_diantarkan',
  'telah_diterima',
  'disita',
  'dilepaskan',
  'kadaluarsa',
  'dikembalikan',
  'paket_anonim',
] as const;

export class UpdatePackageDto {
  @IsNotEmpty({ message: 'Status wajib diisi' })
  @IsIn(VALID_PACKAGE_STATUSES, {
    message: `Status tidak valid. Harus salah satu dari: ${VALID_PACKAGE_STATUSES.join(', ')}`,
  })
  status: string;

  @IsOptional()
  @IsIn(['baik', 'rusak'])
  kondisi?: 'baik' | 'rusak';

  @IsOptional()
  @IsString()
  confiscatedReason?: string;

  @IsOptional()
  @IsString()
  confiscatedNotes?: string;

  @IsOptional()
  @IsString()
  confiscatedBy?: string;

  @IsOptional()
  @IsString()
  confiscatedDate?: string;

  @IsOptional()
  @IsString()
  confiscatedEvidenceUrl?: string;

  @IsOptional()
  @IsString()
  returnCourier?: string;

  @IsOptional()
  @IsString()
  returnTrackingNumber?: string;

  @IsOptional()
  @IsString()
  returnProofUrl?: string;

  @IsOptional()
  @IsString()
  receiverName?: string;

  @IsOptional()
  @IsString()
  receiverTime?: string;

  @IsOptional()
  @IsString()
  rackLocation?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  operator?: string;
}
