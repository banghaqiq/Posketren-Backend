import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PrinterService, PrinterStatusResponse } from './printer.service';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('printer')
export class PrinterController {
  constructor(private readonly printerService: PrinterService) {}

  @Get('status')
  async getStatus(): Promise<PrinterStatusResponse> {
    return this.printerService.getStatus();
  }

  @Post('test-print')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petugaspos')
  async testPrint() {
    return this.printerService.testPrint();
  }

  @Post('set-default')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async setDefault() {
    return this.printerService.setDefault();
  }
}

