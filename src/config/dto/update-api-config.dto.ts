import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject } from 'class-validator';

export class UpdateApiConfigDto {
  @IsNotEmpty({ message: 'Base URL API wajib diisi' })
  @IsString()
  baseUrl: string;

  @IsNotEmpty({ message: 'Token otentikasi wajib diisi' })
  @IsString()
  token: string;

  @IsOptional()
  @IsEnum(['hourly', 'daily', 'weekly', 'manual'], {
    message: "Frekuensi sinkronisasi harus 'hourly', 'daily', 'weekly', atau 'manual'",
  })
  syncFrequency?: 'hourly' | 'daily' | 'weekly' | 'manual';

  @IsOptional()
  @IsObject()
  mapping_json?: Record<string, any>;
}

