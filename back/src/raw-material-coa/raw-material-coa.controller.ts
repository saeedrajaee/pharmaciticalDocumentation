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

import { RawMaterialCoaService } from './raw-material-coa.service';
import {
  CreateStep3RawMaterialCoaDto,
  UpdateStep3RawMaterialCoaDto,
} from './dto/create-raw-material-coa.dto';

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

@Controller('contract-projects/:projectId/raw-material-coa')
export class RawMaterialCoaController {
  constructor(private readonly coaService: RawMaterialCoaService) {}

  /**
   * ایجاد رکورد جدید آنالیز ماده اولیه (COA) همراه با آپلود فایل‌های فارماکوپه و COA
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pharmaCopiaFile', maxCount: 1 },
        { name: 'coaFile', maxCount: 1 },
      ],
      getMulterOptions('step3-coa'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep3RawMaterialCoaDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      pharmaCopiaFile?: Express.Multer.File[];
      coaFile?: Express.Multer.File[];
    },
  ) {
    if (files?.pharmaCopiaFile?.[0]?.path) {
      dto.pharmaCopiaFileUrl = normalizeUploadedFilePath(
        files.pharmaCopiaFile[0].path,
      );
    }
    if (files?.coaFile?.[0]?.path) {
      dto.coaFileUrl = normalizeUploadedFilePath(files.coaFile[0].path);
    }

    return this.coaService.create(projectId, dto, user);
  }

  /**
   * دریافت تمامی رکوردهای COA یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.coaService.findAllByProject(projectId, user);
  }

  /**
   * دریافت جزئیات یک رکورد COA خاص
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.coaService.findOne(id, projectId, user);
  }

  /**
   * ویرایش رکورد COA همراه با امکان جایگزینی یا افزودن فایل‌ها
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'pharmaCopiaFile', maxCount: 1 },
        { name: 'coaFile', maxCount: 1 },
      ],
      getMulterOptions('step3-coa'),
    ),
  )
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStep3RawMaterialCoaDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      pharmaCopiaFile?: Express.Multer.File[];
      coaFile?: Express.Multer.File[];
    },
  ) {
    if (files?.pharmaCopiaFile?.[0]?.path) {
      dto.pharmaCopiaFileUrl = normalizeUploadedFilePath(
        files.pharmaCopiaFile[0].path,
      );
    }
    if (files?.coaFile?.[0]?.path) {
      dto.coaFileUrl = normalizeUploadedFilePath(files.coaFile[0].path);
    }

    return this.coaService.update(id, projectId, dto, user);
  }

  /**
   * حذف یک رکورد COA
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.coaService.remove(id, projectId, user);
  }
}
