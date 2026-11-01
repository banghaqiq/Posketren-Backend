import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { OperatorsService } from './operators.service';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('operators')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class OperatorsController {
  constructor(private operatorsService: OperatorsService) {}

  @Get()
  async findAll() {
    return this.operatorsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.operatorsService.findOne(id);
  }

  @Post()
  async create(@Body() dto: CreateOperatorDto) {
    return this.operatorsService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOperatorDto) {
    return this.operatorsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.operatorsService.remove(id);
  }

  @Put(':id/unlock')
  async unlock(@Param('id') id: string) {
    return this.operatorsService.unlock(id);
  }
}
