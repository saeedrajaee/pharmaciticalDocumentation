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

import { AnalyticalDevlopFinishedService } from './analytical-devlop-finished.service';
import {
  CreateStep5AnalyticalDevlopFinishedDto,
  UpdateStep5AnalyticalDevlopFinishedDto,
} from './dto/create-analytical-devlop-finished.dto';

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

@Controller('contract-projects/:projectId/analytical-devlop-finished')
export class AnalyticalDevlopFinishedController {
  constructor(
    private readonly analyticalDevlopFinishedService: AnalyticalDevlopFinishedService,
  ) {}

  /**
   * ایجاد رکورد Finished برای یک پروژه
   * همراه با آپلود فایل‌های Pharmacopia، Specification و MOA
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pharmacopiaFile', maxCount: 1 },
        { name: 'specFile', maxCount: 1 },
        { name: 'moaFile', maxCount: 1 },
      ],
      getMulterOptions('step5-analytical-devlop-finished'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep5AnalyticalDevlopFinishedDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      pharmacopiaFile?: Express.Multer.File[];
      specFile?: Express.Multer.File[];
      moaFile?: Express.Multer.File[];
    },
  ) {
    if (files?.pharmacopiaFile?.[0]?.path) {
      dto.pharmacopiaFileUrl = normalizeUploadedFilePath(
        files.pharmacopiaFile[0].path,
      );
    }

    if (files?.specFile?.[0]?.path) {
      dto.specFileUrl = normalizeUploadedFilePath(files.specFile[0].path);
    }

    if (files?.moaFile?.[0]?.path) {
      dto.moaFileUrl = normalizeUploadedFilePath(files.moaFile[0].path);
    }

    return this.analyticalDevlopFinishedService.create(projectId, dto, user);
  }

  /**
   * دریافت رکورد Finished یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findOneByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.analyticalDevlopFinishedService.findOneByProject(projectId, user);
  }

  /**
   * ویرایش رکورد Finished یک پروژه (امکان جایگزینی فایل‌ها)
   */
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pharmacopiaFile', maxCount: 1 },
        { name: 'specFile', maxCount: 1 },
        { name: 'moaFile', maxCount: 1 },
      ],
      getMulterOptions('step5-analytical-devlop-finished'),
    ),
  )
  updateByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdateStep5AnalyticalDevlopFinishedDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      pharmacopiaFile?: Express.Multer.File[];
      specFile?: Express.Multer.File[];
      moaFile?: Express.Multer.File[];
    },
  ) {
    if (files?.pharmacopiaFile?.[0]?.path) {
      dto.pharmacopiaFileUrl = normalizeUploadedFilePath(
        files.pharmacopiaFile[0].path,
      );
    }

    if (files?.specFile?.[0]?.path) {
      dto.specFileUrl = normalizeUploadedFilePath(files.specFile[0].path);
    }

    if (files?.moaFile?.[0]?.path) {
      dto.moaFileUrl = normalizeUploadedFilePath(files.moaFile[0].path);
    }

    return this.analyticalDevlopFinishedService.updateByProject(
      projectId,
      dto,
      user,
    );
  }

  /**
   * حذف رکورد Finished یک پروژه
   */
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  removeByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.analyticalDevlopFinishedService.removeByProject(projectId, user);
  }
}
