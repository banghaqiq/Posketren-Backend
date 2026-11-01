import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateOperatorDto {
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: 'Kata sandi wajib diisi' })
  @IsString()
  password: string;

  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Role wajib dipilih' })
  @IsEnum(['admin', 'petugaspos', 'keamanan'], {
    message: "Role harus salah satu dari: 'admin', 'petugaspos', 'keamanan'",
  })
  role: 'admin' | 'petugaspos' | 'keamanan';

  @IsOptional()
  @IsString()
  photo?: string;
}
