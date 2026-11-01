import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiConfigService } from './api-config.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UpdateApiConfigDto } from './dto/update-api-config.dto';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class ApiConfigController {
  constructor(private configService: ApiConfigService) {}

  @Get('config')
  async getConfig() {
    return this.configService.getConfig();
  }

  @Put('config')
  async updateConfig(@Body() dto: UpdateApiConfigDto) {
    return this.configService.updateConfig(dto);
  }

  @Get('cron')
  async triggerCron() {
    return this.configService.triggerSync();
  }
}
