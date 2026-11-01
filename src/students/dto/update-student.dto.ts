import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateStudentDto {
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  @IsString()
  nama_lengkap: string;

  @IsNotEmpty({ message: 'Jenis kelamin wajib diisi' })
  @IsString()
  jenis_kelamin: string;

  @IsNotEmpty({ message: 'Daerah / Blok asrama wajib diisi' })
  @IsString()
  daerah: string;

  @IsNotEmpty({ message: 'Wilayah asrama wajib diisi' })
  @IsString()
  wilayah: string;
}
