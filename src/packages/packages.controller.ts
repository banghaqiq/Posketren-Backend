import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  Res,
  HttpStatus,
  HttpCode,
  UseGuards,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';
import { BulkCreatePackageDto } from './dto/bulk-create-package.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { JwtService } from '@nestjs/jwt';
import { Response, Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Controller('packages')
export class PackagesController {
    constructor(
      private packagesService: PackagesService,
      private jwtService: JwtService,
      private prisma: PrismaService,
    ) {}

    private async assertPackageAccess(id: string, actor: any) {
      const pkg = await this.packagesService.findOne(id);

      if (actor.role === 'keamanan') {
        if (!actor.wilayah || pkg.wilayah !== actor.wilayah) {
          throw new NotFoundException('Paket tidak ditemukan');
        }
      }

      return pkg;
    }

  @Get()
  async findAll(
    @Req() req: Request,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('courier') courier?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('wilayah') wilayah?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Determine if requester is an authenticated operator or a public tracking guest
    let isAuthenticated = false;
    let securityWilayah: string | null = null; 
    const authHeader = req.headers.authorization;
    const token =
      req.cookies?.['access_token'] ||
      (authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : undefined);

    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync(token);
        const userId = payload.id || payload.sub;

        const operator = await this.prisma.operator.findUnique({
          where: { id: userId },
          select: {
            id: true,
            role: true,
            wilayah: true,
            locked_until: true,
          },
        });

        if (operator) {
          if (operator.locked_until && operator.locked_until > new Date()) {
            throw new UnauthorizedException(
              'Akun sedang terkunci karena keamanan',
            );
          }

          isAuthenticated = true;

          if (operator.role === 'keamanan') {
            securityWilayah = operator.wilayah ?? '';
          }
        }
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }

        isAuthenticated = false;
        securityWilayah = null;
      }
    }

    // Unauthenticated public tracking MUST provide at least 3 characters of search term
    // to strictly prevent unauthorized bulk package scraping
    if (!isAuthenticated) {
      if (!search || search.trim().length < 3) {
        return [];
      }
    }

    return this.packagesService.findAll({
      search,
      status,
      type,
      courier,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      isPublic: !isAuthenticated,
      securityWilayah,
      wilayah,
      startDate,
      endDate,
    });
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petugaspos', 'keamanan')
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.assertPackageAccess(id, req.user);
  }

  @Post('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petugaspos')
  async bulkCreate(@Body() body: BulkCreatePackageDto, @Req() req: any) {
    const list = body.packages || [];
    const operator = req.user?.name || body.operator || 'Petugas Pos';
    return this.packagesService.bulkCreate(list, operator);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petugaspos')
  async create(@Body() dto: CreatePackageDto, @Req() req: any) {
    const operator = req.user?.name || dto.operator || 'Petugas Pos';
    return this.packagesService.create(dto, operator);
  }
  
  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petugaspos', 'keamanan')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdatePackageDto,
    @Req() req: any,
  ) {
    await this.assertPackageAccess(id, req.user);

    const operator = req.user?.name || dto.operator || 'Petugas Pos';

    return this.packagesService.update(id, dto, operator, req.user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async remove(@Param('id') id: string, @Req() req: any, @Body() body?: any) {
    const operator = req.user?.name || body?.operator || 'Admin';
    return this.packagesService.remove(id, operator);
  }

  @Post(':id/proof')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petugaspos', 'keamanan')
  @HttpCode(HttpStatus.OK)
  async uploadProof(
    @Param('id') id: string,
    @Body() body: { image: string; mimeType?: string },
    @Req() req: any,
  ) {
    await this.assertPackageAccess(id, req.user);

    const mime = body.mimeType || 'image/webp';

    return this.packagesService.saveProof(id, body.image, mime, req.user);
  }

  @Get(':id/proof')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petugaspos', 'keamanan')
  async getProof(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    await this.assertPackageAccess(id, req.user);

    const proof = await this.packagesService.getProof(id, req.user);

    // Security header against MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // If data URL format
    if (proof.imageData.startsWith('data:')) {
      const parts = proof.imageData.split(',');
      const matches = parts[0].match(/:(.*?);/);
      const mime = matches ? matches[1] : proof.mimeType;
      const buffer = Buffer.from(parts[1], 'base64');
      res.setHeader('Content-Type', mime);
      return res.send(buffer);
    }

    // If pure base64
    const buffer = Buffer.from(proof.imageData, 'base64');
    res.setHeader('Content-Type', proof.mimeType);
    return res.send(buffer);
  }

  @Delete(':id/proof')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'petugaspos')
  async deleteProof(@Param('id') id: string) {
    return this.packagesService.deleteProof(id);
  }
}
