import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';

import { ManifestsService } from './manifests.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('manifests')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'petugaspos', 'keamanan')
export class ManifestsController {
  constructor(private manifestsService: ManifestsService) {}

  @Get()
  async findAll() {
    return this.manifestsService.findAll();
  }

  @Post()
  async create(
    @Body()
    body: {
      packageId?: string;
      packageIds?: string[];
      notes?: string;
      rackLocation?: string;
      status?: string;
    },
  ) {
    return this.manifestsService.create(body);
  }
}
