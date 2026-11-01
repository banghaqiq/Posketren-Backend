import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private studentsService: StudentsService) {}

  @Get()
  async findAll(@Query('search') search?: string) {
    return this.studentsService.findAll(search);
  }

  @Get(':niup')
  async findOne(@Param('niup') niup: string) {
    return this.studentsService.findOne(niup);
  }

  @Post('bulk')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async bulkCreate(@Body() body: { students: CreateStudentDto[] }) {
    const list = Array.isArray(body) ? body : body.students || [];
    return this.studentsService.bulkUpsert(list);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async create(@Body() dto: CreateStudentDto) {
    return this.studentsService.create(dto);
  }

  @Put(':niup')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async update(@Param('niup') niup: string, @Body() dto: UpdateStudentDto) {
    return this.studentsService.update(niup, dto);
  }

  @Delete(':niup')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async remove(@Param('niup') niup: string) {
    return this.studentsService.remove(niup);
  }
}
