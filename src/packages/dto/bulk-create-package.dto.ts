import { IsArray, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePackageDto } from './create-package.dto';

export class BulkCreatePackageDto {
  @IsArray({ message: 'packages harus berupa array data paket' })
  @ValidateNested({ each: true })
  @Type(() => CreatePackageDto)
  packages: CreatePackageDto[];

  @IsOptional()
  @IsString()
  operator?: string;
}

