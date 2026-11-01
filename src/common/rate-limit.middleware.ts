import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private ipRecords: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Periodically clean up expired IP records every 5 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.ipRecords.entries()) {
        if (now > record.resetTime) {
          this.ipRecords.delete(key);
        }
      }
    }, 5 * 60 * 1000);

    // Ensure timer does not prevent process termination
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Extract real client IP, considering reverse proxy headers
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = (
      typeof forwarded === 'string'
        ? forwarded.split(',')[0].trim()
        : req.socket.remoteAddress || 'unknown'
    ).replace(/^.*:/, ''); // normalize IPv6 mapped IPv4

    const path = req.path.toLowerCase();
    const isLogin = path.includes('/auth/login');
    const isPublicSearch = path.includes('/packages') && req.method === 'GET';

    // Tiered Rate Limit Configurations
    let maxLimit = 300; // Standard API limit per minute
    let windowMs = 60 * 1000; // 1 minute window

    if (isLogin) {
      maxLimit = 15; // Max 15 login attempts per minute per IP
    } else if (isPublicSearch) {
      maxLimit = 60; // Max 60 package searches per minute per IP
    }

    const recordKey = `${clientIp}:${isLogin ? 'login' : isPublicSearch ? 'search' : 'general'}`;
    const now = Date.now();
    let record = this.ipRecords.get(recordKey);

    if (!record || now > record.resetTime) {
      record = { count: 1, resetTime: now + windowMs };
      this.ipRecords.set(recordKey, record);
    } else {
      record.count++;
    }

    const remaining = Math.max(0, maxLimit - record.count);
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', maxLimit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > maxLimit) {
      res.setHeader('Retry-After', retryAfter);
      return res.status(HttpStatus.TOO_MANY_REQUESTS).json({
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        error: 'Too Many Requests',
        message: isLogin
          ? `Terlalu banyak percobaan login dari IP Anda. Silakan coba kembali dalam ${retryAfter} detik.`
          : `Batas kecepatan request (Rate Limit) terlampaui. Coba lagi dalam ${retryAfter} detik.`,
        retryAfterSeconds: retryAfter,
        timestamp: new Date().toISOString(),
      });
    }

    next();
  }
}

