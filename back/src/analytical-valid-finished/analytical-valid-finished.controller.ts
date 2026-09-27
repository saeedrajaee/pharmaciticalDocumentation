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

import { AnalyticalValidFinishedService } from './analytical-valid-finished.service';
import {
  CreateStep6AnalyticalValidFinishedDto,
  UpdateStep6AnalyticalValidFinishedDto,
} from './dto/create-analytical-valid-finished.dto';

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

@Controller('contract-projects/:projectId/analytical-valid-finished')
export class AnalyticalValidFinishedController {
  constructor(
    private readonly analyticalValidFinishedService: AnalyticalValidFinishedService,
  ) {}

  /**
   * ایجاد رکورد Step6 Analytical Valid Finished برای یک پروژه
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
      getMulterOptions('step6-analytical-valid-finished'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep6AnalyticalValidFinishedDto,
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

    return this.analyticalValidFinishedService.create(projectId, dto, user);
  }

  /**
   * دریافت رکورد Step6 Analytical Valid Finished یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findOneByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.analyticalValidFinishedService.findOneByProject(projectId, user);
  }

  /**
   * ویرایش رکورد Step6 Analytical Valid Finished یک پروژه (امکان جایگزینی فایل‌ها)
   */
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'assayFile', maxCount: 1 },
        { name: 'impurityFile', maxCount: 1 },
      ],
      getMulterOptions('step6-analytical-valid-finished'),
    ),
  )
  updateByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdateStep6AnalyticalValidFinishedDto,
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

    return this.analyticalValidFinishedService.updateByProject(
      projectId,
      dto,
      user,
    );
  }

  /**
   * حذف رکورد Step6 Analytical Valid Finished یک پروژه
   */
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  removeByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.analyticalValidFinishedService.removeByProject(projectId, user);
  }
}
