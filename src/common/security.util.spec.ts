import { validateBase64Image } from './security.util';
import { BadRequestException } from '@nestjs/common';

describe('SecurityUtil - validateBase64Image', () => {
  it('should throw if dataUrl is empty or not string', () => {
    expect(() => validateBase64Image('')).toThrow(BadRequestException);
    // @ts-ignore
    expect(() => validateBase64Image(null)).toThrow(BadRequestException);
  });

  it('should throw if dataUrl does not match base64 pattern', () => {
    expect(() => validateBase64Image('invalid-string')).toThrow(BadRequestException);
  });

  it('should throw if MIME type is not allowed (e.g. svg or html)', () => {
    const svgData = 'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=';
    expect(() => validateBase64Image(svgData)).toThrow(BadRequestException);
  });

  it('should successfully parse valid WebP base64', () => {
    // 1x1 transparent WebP base64
    const validWebP = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vwq/s4AAA==';
    const result = validateBase64Image(validWebP, 1024 * 1024, 'Foto Profil');
    expect(result.mimeType).toBe('image/webp');
    expect(result.buffer).toBeInstanceOf(Buffer);
  });

  it('should throw if payload exceeds maxBytes', () => {
    const validWebP = 'data:image/webp;base64,UklGRkAAAABXRUJQVlA4IDQAAADwAQCdASoBAAEAAkA4JaQAA3AA/vwq/s4AAA==';
    expect(() => validateBase64Image(validWebP, 10, 'Foto')).toThrow(BadRequestException);
  });

  it('should reject disguised files where magic bytes do not match declared MIME', () => {
    // Declare JPEG but send text bytes
    const fakeJpeg = 'data:image/jpeg;base64,' + Buffer.from('<?php echo "evil"; ?>').toString('base64');
    expect(() => validateBase64Image(fakeJpeg)).toThrow(BadRequestException);
  });
});
