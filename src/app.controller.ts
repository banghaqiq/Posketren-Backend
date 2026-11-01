import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  checkHealth() {
    return {
      status: 'ok',
      service: 'posketren-backend',
      timestamp: new Date().toISOString(),
    };
  }
}

