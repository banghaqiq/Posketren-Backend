import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LogsService } from './logs.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('logs')
@UseGuards(JwtAuthGuard)
export class LogsController {
  constructor(private logsService: LogsService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('type') type?: string,
  ) {
    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    return this.logsService.findAll(safePage, safeLimit, type);
  }

  @Post()
  async create(
    @Body()
    body: {
      type: string;
      title: string;
      description: string;
      operator?: string;
      timestamp?: string;
    },
    @Req() req: any,
  ) {
    // Strictly prefer authenticated operator identity to prevent audit log forgery
    const operator = req.user?.name || body.operator || 'Sistem Posketren';
    return this.logsService.create({
      type: body.type,
      title: body.title,
      description: body.description,
      operator,
      timestamp: body.timestamp,
    });
  }

  @Delete('cleanup')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async cleanup(
    @Query('days') days?: string,
    @Query('all') all?: string,
  ) {
    const isAll = all === 'true' || all === '1';
    const dayCount = days ? Number(days) : 7;
    return this.logsService.cleanup(dayCount, isAll);
  }
}
