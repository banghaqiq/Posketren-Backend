import { IsString, IsNotEmpty, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { VALID_PACKAGE_STATUSES } from './update-package.dto';

export class CreatePackageDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsNotEmpty({ message: 'Nomor resi wajib diisi' })
  @IsString()
  trackingNumber: string;

  @IsOptional()
  @IsString()
  courier?: string;

  @IsNotEmpty({ message: 'NIUP / ID Penerima wajib diisi' })
  @IsString()
  recipientId: string;

  @IsNotEmpty({ message: 'Nama Penerima wajib diisi' })
  @IsString()
  recipientName: string;

  @IsOptional()
  @IsEnum(['Putra', 'Putri'], { message: "Asrama harus bernilai 'Putra' atau 'Putri'" })
  asrama?: 'Putra' | 'Putri' | null;

  @IsNotEmpty({ message: 'Wilayah wajib diisi' })
  @IsString()
  wilayah: string;

  @IsNotEmpty({ message: 'Daerah wajib diisi' })
  @IsString()
  daerah: string;

  @IsOptional()
  @IsString()
  room?: string;

  @IsOptional()
  @IsEnum(['regular', 'jastip'])
  type?: 'regular' | 'jastip';

  @IsOptional()
  @IsEnum(VALID_PACKAGE_STATUSES, {
    message: `Status tidak valid. Harus salah satu dari: ${VALID_PACKAGE_STATUSES.join(', ')}`,
  })
  status?: string;

  @IsNotEmpty({ message: 'Tanggal penerimaan wajib diisi' })
  @IsString()
  dateReceived: string;

  @IsOptional()
  @IsEnum(['baik', 'rusak'])
  kondisi?: 'baik' | 'rusak';

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  arrivalTime?: string;

  @IsOptional()
  @IsBoolean()
  isExternalRecipient?: boolean;

  @IsOptional()
  @IsString()
  manualRecipientName?: string;

  @IsOptional()
  @IsString()
  rackLocation?: string;

  @IsOptional()
  @IsString()
  operator?: string;
}
