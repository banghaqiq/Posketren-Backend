import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PackagesModule } from './packages/packages.module';
import { StudentsModule } from './students/students.module';
import { OperatorsModule } from './operators/operators.module';
import { LogsModule } from './logs/logs.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ManifestsModule } from './manifests/manifests.module';
import { ApiConfigModule } from './config/api-config.module';
import { PrinterModule } from './printer/printer.module';
import { RateLimitMiddleware } from './common/rate-limit.middleware';
import { AppController } from './app.controller';

@Module({
  controllers: [AppController],
  imports: [
    PrismaModule,
    AuthModule,
    PackagesModule,
    StudentsModule,
    OperatorsModule,
    LogsModule,
    AnalyticsModule,
    ManifestsModule,
    ApiConfigModule,
    PrinterModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
