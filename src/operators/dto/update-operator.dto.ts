import { IsString, IsEnum, IsOptional } from 'class-validator';
import { Matches } from 'class-validator';

export class UpdateOperatorDto {
  @IsOptional()
  @IsString()
  @Matches(/^\S+$/, {
    message: 'Username tidak boleh mengandung spasi',
  })
  username?: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(['admin', 'petugaspos', 'keamanan'], {
    message: "Role harus salah satu dari: 'admin', 'petugaspos', 'keamanan'",
  })
  role?: 'admin' | 'petugaspos' | 'keamanan';

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  wilayah?: string;
}
