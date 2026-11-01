import { Module } from '@nestjs/common';
import { ApiConfigService } from './api-config.service';
import { ApiConfigController } from './api-config.controller';

@Module({
  controllers: [ApiConfigController],
  providers: [ApiConfigService],
  exports: [ApiConfigService],
})
export class ApiConfigModule {}
