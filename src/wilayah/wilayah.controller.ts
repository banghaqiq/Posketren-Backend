import { Controller, Get, UseGuards } from '@nestjs/common';
import { WilayahService } from './wilayah.service';
import { JwtAuthGuard } from '../auth/jwt.guard';

@Controller('wilayah')
@UseGuards(JwtAuthGuard)
export class WilayahController {
  constructor(private readonly wilayahService: WilayahService) {}

  @Get()
  getAll() {
    return this.wilayahService.getAll();
  }

  @Get('names')
  getNames() {
    return this.wilayahService.getNames();
  }
}
