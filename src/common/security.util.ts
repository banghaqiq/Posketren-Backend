import { BadRequestException } from '@nestjs/common';

const ALLOWED_MIME_TYPES = ['image/webp', 'image/jpeg', 'image/png'];

/**
 * Validates base64 image data URL, checking MIME type, size limit, and file magic bytes.
 * Rejects SVG, HTML, scripts, executables, or oversized payloads.
 */
export function validateBase64Image(
  dataUrl: string,
  maxBytes: number = 2 * 1024 * 1024,
  fieldName: string = 'Foto'
): { mimeType: string; buffer: Buffer } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new BadRequestException(`${fieldName} tidak boleh kosong`);
  }

  // Must match data:image/<type>;base64,<data>
  const matches = dataUrl.match(/^data:(image\/[a-zA-Z0-9\.\+-]+);base64,(.+)$/);
  if (!matches) {
    throw new BadRequestException(
      `${fieldName} harus berupa data URL gambar base64 yang valid (data:image/...;base64,...)`
    );
  }

  const mimeType = matches[1].toLowerCase();
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new BadRequestException(
      `Format ${fieldName} tidak diizinkan. Hanya format WebP, JPEG, dan PNG yang diperbolehkan.`
    );
  }

  const base64Data = matches[2];
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Data, 'base64');
  } catch (e) {
    throw new BadRequestException(`Data base64 ${fieldName} korup atau tidak valid`);
  }

  if (buffer.length > maxBytes) {
    const maxMB = (maxBytes / (1024 * 1024)).toFixed(1);
    throw new BadRequestException(
      `Ukuran ${fieldName} (${(buffer.length / (1024 * 1024)).toFixed(1)} MB) melebihi batas maksimal ${maxMB} MB`
    );
  }

  // Validate magic bytes to prevent masquerading attacks
  if (mimeType === 'image/webp') {
    // WebP: RIFF (bytes 0-3) and WEBP (bytes 8-11)
    const isRiff = buffer.slice(0, 4).toString('ascii') === 'RIFF';
    const isWebp = buffer.slice(8, 12).toString('ascii') === 'WEBP';
    if (!isRiff || !isWebp) {
      throw new BadRequestException(`File ${fieldName} terdeteksi bukan file WebP asli yang valid`);
    }
  } else if (mimeType === 'image/jpeg') {
    // JPEG: 0xFF, 0xD8, 0xFF
    if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
      throw new BadRequestException(`File ${fieldName} terdeteksi bukan file JPEG asli yang valid`);
    }
  } else if (mimeType === 'image/png') {
    // PNG: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    if (
      buffer[0] !== 0x89 ||
      buffer[1] !== 0x50 ||
      buffer[2] !== 0x4e ||
      buffer[3] !== 0x47
    ) {
      throw new BadRequestException(`File ${fieldName} terdeteksi bukan file PNG asli yang valid`);
    }
  }

  return { mimeType, buffer };
}

