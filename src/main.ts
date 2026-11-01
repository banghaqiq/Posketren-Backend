import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import * as express from 'express';
import { AllExceptionsFilter } from './common/all-exceptions.filter';

async function bootstrap() {
  // Validate production security requirements
  const isProd = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;
  const defaultFallbackSecret = 'njpackage_posketren_super_secret_key_2026';

  if (isProd) {
    if (!jwtSecret || jwtSecret === defaultFallbackSecret || jwtSecret.length < 32) {
      console.error(
        '\x1b[31m%s\x1b[0m',
        '❌ [SECURITY FATAL] Pada mode PRODUCTION, JWT_SECRET wajib diatur dalam file .env dengan kunci acak kuat minimal 32 karakter dan tidak boleh menggunakan secret default!'
      );
      process.exit(1);
    }
  } else if (!jwtSecret || jwtSecret === defaultFallbackSecret) {
    console.warn(
      '\x1b[33m%s\x1b[0m',
      '⚠️  [SECURITY WARNING] JWT_SECRET menggunakan default development secret. Segera buat kunci acak unik sebelum beralih ke production.'
    );
  }

  const app = await NestFactory.create(AppModule);

  // Trust reverse proxy (Nginx, Docker, Cloudflare)
  const expressApp = app.getHttpAdapter().getInstance() as express.Application;
  expressApp.set('trust proxy', 1);

  // Security Headers Middleware
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(self), microphone=()');
    res.removeHeader('X-Powered-By');
    next();
  });

  // Body parser limit (max 5MB for compressed WebP photos)
  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ limit: '5mb', extended: true }));

  // Cookie parser for JWT
  app.use(cookieParser());

  // CORS setup with explicit origin allowlist
  const allowedOrigins = [
    'https://posketren.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  // Global prefix /api per README
  app.setGlobalPrefix('api');

  // Global Sanitized Exception Filter (prevents internal stack traces & path leakages)
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
  console.log(`POSKETREN NJ Backend is running securely on: http://localhost:${port}/api`);
}
bootstrap();
