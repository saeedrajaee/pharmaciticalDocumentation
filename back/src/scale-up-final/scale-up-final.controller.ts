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

import { ScaleUpFinalService } from './scale-up-final.service';
import {
  CreateStep7ScaleUpFinalDto,
  UpdateStep7ScaleUpFinalDto,
} from './dto/create-scale-up-final.dto';

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

@Controller('contract-projects/:projectId/scale-up-final')
export class ScaleUpFinalController {
  constructor(private readonly scaleUpFinalService: ScaleUpFinalService) {}

  /**
   * ایجاد رکورد ScaleUp Final برای یک پروژه
   * همراه با آپلود فایل‌های انتقال تکنولوژی (Production و QC)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'productionTechnologyTransferDocumentFile',
          maxCount: 1,
        },
        {
          name: 'technologyTransferDocumentQCFile',
          maxCount: 1,
        },
      ],
      getMulterOptions('step7-scale-up-final'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep7ScaleUpFinalDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      productionTechnologyTransferDocumentFile?: Express.Multer.File[];
      technologyTransferDocumentQCFile?: Express.Multer.File[];
    },
  ) {
    if (files?.productionTechnologyTransferDocumentFile?.[0]?.path) {
      dto.productionTechnologyTransferDocumentFileUrl = normalizeUploadedFilePath(
        files.productionTechnologyTransferDocumentFile[0].path,
      );
    }

    if (files?.technologyTransferDocumentQCFile?.[0]?.path) {
      dto.technologyTransferDocumentQCFileUrl = normalizeUploadedFilePath(
        files.technologyTransferDocumentQCFile[0].path,
      );
    }

    return this.scaleUpFinalService.create(projectId, dto, user);
  }

  /**
   * دریافت رکورد ScaleUp Final یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findOneByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.scaleUpFinalService.findOneByProject(projectId, user);
  }

  /**
   * ویرایش رکورد ScaleUp Final یک پروژه (امکان جایگزینی فایل‌ها)
   */
  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        {
          name: 'productionTechnologyTransferDocumentFile',
          maxCount: 1,
        },
        {
          name: 'technologyTransferDocumentQCFile',
          maxCount: 1,
        },
      ],
      getMulterOptions('step7-scale-up-final'),
    ),
  )
  updateByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: UpdateStep7ScaleUpFinalDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      productionTechnologyTransferDocumentFile?: Express.Multer.File[];
      technologyTransferDocumentQCFile?: Express.Multer.File[];
    },
  ) {
    if (files?.productionTechnologyTransferDocumentFile?.[0]?.path) {
      dto.productionTechnologyTransferDocumentFileUrl = normalizeUploadedFilePath(
        files.productionTechnologyTransferDocumentFile[0].path,
      );
    }

    if (files?.technologyTransferDocumentQCFile?.[0]?.path) {
      dto.technologyTransferDocumentQCFileUrl = normalizeUploadedFilePath(
        files.technologyTransferDocumentQCFile[0].path,
      );
    }

    return this.scaleUpFinalService.updateByProject(projectId, dto, user);
  }

  /**
   * حذف رکورد ScaleUp Final یک پروژه
   */
  @Delete()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  removeByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.scaleUpFinalService.removeByProject(projectId, user);
  }
}
