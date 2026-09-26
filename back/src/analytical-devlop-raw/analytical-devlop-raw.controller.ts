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

import { AnalyticalDevlopRawService } from './analytical-devlop-raw.service';
import {
  CreateStep5AnalyticalDevlopRawDto,
  UpdateStep5Step5AnalyticalDevlopRawDto,
} from './dto/create-analytical-devlop-raw.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';
import { getMulterOptions } from 'src/multer.config';

function normalizeUploadedFilePath(filePath: string): string {
  if (!filePath) {
    return '';
  }

  return `/${filePath
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')}`;
}

@Controller('contract-projects/:projectId/analytical-devlop-raw')
export class AnalyticalDevlopRawController {
  constructor(
    private readonly analyticalDevlopRawService: AnalyticalDevlopRawService,
  ) {}

  /**
   * ایجاد رکورد جدید Analytical Develop Raw
   * همراه با آپلود فایل‌های Specification، MOA و DMF
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'specFile', maxCount: 1 },
        { name: 'moaFile', maxCount: 1 },
        { name: 'dmfFile', maxCount: 1 },
      ],
      getMulterOptions('step5-analytical-devlop-raw'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep5AnalyticalDevlopRawDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      specFile?: Express.Multer.File[];
      moaFile?: Express.Multer.File[];
      dmfFile?: Express.Multer.File[];
    },
  ) {
    if (files?.specFile?.[0]?.path) {
      dto.specFileUrl = normalizeUploadedFilePath(
        files.specFile[0].path,
      );
    }

    if (files?.moaFile?.[0]?.path) {
      dto.moaFileUrl = normalizeUploadedFilePath(
        files.moaFile[0].path,
      );
    }

    if (files?.dmfFile?.[0]?.path) {
      dto.dmfFileUrl = normalizeUploadedFilePath(
        files.dmfFile[0].path,
      );
    }

    return this.analyticalDevlopRawService.create(projectId, dto, user);
  }

  /**
   * دریافت تمام رکوردهای Analytical Develop Raw یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.analyticalDevlopRawService.findAllByProject(
      projectId,
      user,
    );
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
    return this.analyticalDevlopRawService.findOne(
      id,
      projectId,
      user,
    );
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
        { name: 'specFile', maxCount: 1 },
        { name: 'moaFile', maxCount: 1 },
        { name: 'dmfFile', maxCount: 1 },
      ],
      getMulterOptions('step5-analytical-devlop-raw'),
    ),
  )
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStep5Step5AnalyticalDevlopRawDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      specFile?: Express.Multer.File[];
      moaFile?: Express.Multer.File[];
      dmfFile?: Express.Multer.File[];
    },
  ) {
    if (files?.specFile?.[0]?.path) {
      dto.specFileUrl = normalizeUploadedFilePath(
        files.specFile[0].path,
      );
    }

    if (files?.moaFile?.[0]?.path) {
      dto.moaFileUrl = normalizeUploadedFilePath(
        files.moaFile[0].path,
      );
    }

    if (files?.dmfFile?.[0]?.path) {
      dto.dmfFileUrl = normalizeUploadedFilePath(
        files.dmfFile[0].path,
      );
    }

    return this.analyticalDevlopRawService.update(
      id,
      projectId,
      dto,
      user,
    );
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
    return this.analyticalDevlopRawService.remove(
      id,
      projectId,
      user,
    );
  }
}
