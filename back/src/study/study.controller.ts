import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';

import { StudyService } from './study.service';
import {
  CreateStep1LiteratureStudyDto,
  UpdateStep1LiteratureStudyDto,
} from './dto/create-study.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';
import { getMulterOptions } from 'src/multer.config';

/**
 * تبدیل مسیر فایل ذخیره‌شده توسط Multer
 * به مسیر قابل استفاده در URL
 *
 * نمونه ورودی:
 * ./uploads/contracts/step1-studies/file.pdf
 * uploads/contracts/step1-studies/file.pdf
 * uploads\contracts\step1-studies\file.pdf
 *
 * خروجی:
 * /uploads/contracts/step1-studies/file.pdf
 */
function normalizeUploadedFilePath(filePath: string): string {
  if (!filePath) {
    return '';
  }

  return `/${filePath
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')}`;
}

@Controller('contract-projects/:projectId/studies')
export class StudyController {
  constructor(private readonly studyService: StudyService) {}

  /**
   * ایجاد مطالعه جدید همراه با آپلود اختیاری فایل
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('step1-studies')))
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep1LiteratureStudyDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.path) {
      dto.fileUrl = normalizeUploadedFilePath(file.path);
    }

    return this.studyService.create(projectId, dto, user);
  }

  /**
   * دریافت تمام مطالعات مربوط به یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.studyService.findAllByProject(projectId, user);
  }

  /**
   * دریافت جزئیات یک مطالعه خاص
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.studyService.findOne(id, projectId, user);
  }

  /**
   * ویرایش مطالعه همراه با امکان جایگزینی یا افزودن فایل
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('step1-studies')))
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStep1LiteratureStudyDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.path) {
      dto.fileUrl = normalizeUploadedFilePath(file.path);
    }

    return this.studyService.update(id, projectId, dto, user);
  }
  /**
   * حذف مطالعه
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.studyService.remove(id, projectId, user);
  }
}