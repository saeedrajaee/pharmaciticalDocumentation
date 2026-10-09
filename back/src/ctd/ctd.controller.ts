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

import { CtdService } from './ctd.service';
import {
  CreateStep8CtdModuleDto,
  UpdateStep8CtdModuleDto,
} from './dto/create-ctd.dto';

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

@Controller('contract-projects/:projectId/ctd')
export class CtdController {
  constructor(private readonly ctdService: CtdService) {}

  /**
   * ایجاد رکورد CTD برای یک پروژه
   * همراه با آپلود فایل پرونده CTD و فایل نامه تاییدیه سازمان غذا و دارو
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'ctdFile', maxCount: 1 },
        { name: 'fdaApprovalLetterFile', maxCount: 1 },
      ],
      getMulterOptions('step8-ctd-module'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep8CtdModuleDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      ctdFile?: Express.Multer.File[];
      fdaApprovalLetterFile?: Express.Multer.File[];
    },
  ) {
    if (files?.ctdFile?.[0]?.path) {
      dto.ctdFileUrl = normalizeUploadedFilePath(files.ctdFile[0].path);
    }

    if (files?.fdaApprovalLetterFile?.[0]?.path) {
      dto.fdaApprovalLetterFileUrl = normalizeUploadedFilePath(
        files.fdaApprovalLetterFile[0].path,
      );
    }

    return this.ctdService.create(projectId, dto, user);
  }

  /**
   * دریافت رکورد CTD یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findOneByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.ctdService.findOneByProject(projectId, user);
  }

  /**
   * ویرایش رکورد CTD یک پروژه (همراه با امکان جایگزینی فایل‌ها)
   */
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'ctdFile', maxCount: 1 },
        { name: 'fdaApprovalLetterFile', maxCount: 1 },
      ],
      getMulterOptions('step8-ctd-module'),
    ),
  )
  updateByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdateStep8CtdModuleDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      ctdFile?: Express.Multer.File[];
      fdaApprovalLetterFile?: Express.Multer.File[];
    },
  ) {
    if (files?.ctdFile?.[0]?.path) {
      dto.ctdFileUrl = normalizeUploadedFilePath(files.ctdFile[0].path);
    }

    if (files?.fdaApprovalLetterFile?.[0]?.path) {
      dto.fdaApprovalLetterFileUrl = normalizeUploadedFilePath(
        files.fdaApprovalLetterFile[0].path,
      );
    }

    return this.ctdService.updateByProject(projectId, dto, user);
  }

  /**
   * حذف رکورد CTD یک پروژه
   */
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  removeByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.ctdService.removeByProject(projectId, user);
  }
}
