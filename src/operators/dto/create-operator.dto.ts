import { IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { Matches } from 'class-validator';

export class CreateOperatorDto {
  @IsNotEmpty({ message: 'Username wajib diisi' })
  @IsString() 
  @Matches(/^\S+$/, {
    message: 'Username tidak boleh mengandung spasi',
  })
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

  @IsOptional()
  @IsString()
  wilayah?: string;
}
