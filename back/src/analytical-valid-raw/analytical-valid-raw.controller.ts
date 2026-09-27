import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { Role } from '@prisma/client';

import { AnalyticalValidRawService } from './analytical-valid-raw.service';
import {
  CreateStep5AnalyticalDevlopRawDto,
  UpdateStep5AnalyticalDevlopRawDto,
} from './dto/create-analytical-valid-raw.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';
import { getMulterOptions } from 'src/multer.config';

function normalizeUploadedFilePath(filePath: string): string {
  if (!filePath) return '';

  return `/${filePath
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')}`;
}

/**
 * مسیر را project-based نگه می‌داریم مثل سایر Stepها
 * (درست مشابه کنترلر نمونه)
 */
@Controller('contract-projects/:projectId/analytical-valid-raw')
export class AnalyticalValidRawController {
  constructor(
    private readonly analyticalValidRawService: AnalyticalValidRawService,
  ) {}

  /**
   * ایجاد رکورد جدید Analytical Valid Raw
   * همراه با آپلود فایل‌های Assay و Impurity
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'assayFile', maxCount: 1 },
        { name: 'impurityFile', maxCount: 1 },
      ],
      getMulterOptions('step6-analytical-valid-raw'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep5AnalyticalDevlopRawDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      assayFile?: Express.Multer.File[];
      impurityFile?: Express.Multer.File[];
    },
  ) {
    if (files?.assayFile?.[0]?.path) {
      dto.assayFileUrl = normalizeUploadedFilePath(files.assayFile[0].path);
    }

    if (files?.impurityFile?.[0]?.path) {
      dto.impurityFileUrl = normalizeUploadedFilePath(
        files.impurityFile[0].path,
      );
    }

    return this.analyticalValidRawService.create(projectId, dto, user);
  }

  /**
   * دریافت تمام رکوردهای Analytical Valid Raw یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.analyticalValidRawService.findAllByProject(projectId, user);
  }

  /**
   * دریافت جزئیات یک رکورد خاص
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.analyticalValidRawService.findOne(id, projectId, user);
  }

  /**
   * ویرایش رکورد و امکان جایگزینی فایل‌ها
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'assayFile', maxCount: 1 },
        { name: 'impurityFile', maxCount: 1 },
      ],
      getMulterOptions('step6-analytical-valid-raw'),
    ),
  )
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStep5AnalyticalDevlopRawDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      assayFile?: Express.Multer.File[];
      impurityFile?: Express.Multer.File[];
    },
  ) {
    if (files?.assayFile?.[0]?.path) {
      dto.assayFileUrl = normalizeUploadedFilePath(files.assayFile[0].path);
    }

    if (files?.impurityFile?.[0]?.path) {
      dto.impurityFileUrl = normalizeUploadedFilePath(
        files.impurityFile[0].path,
      );
    }

    return this.analyticalValidRawService.update(id, projectId, dto, user);
  }

  /**
   * حذف یک رکورد
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.analyticalValidRawService.remove(id, projectId, user);
  }
}
