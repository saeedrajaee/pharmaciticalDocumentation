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

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';
import { getMulterOptions } from 'src/multer.config';

import { ScaleUpTrialService } from './scale-up-trial.service';
import {
  CreateStep6ScaleUpTrialDto,
  UpdateStep6ScaleUpTrialDto,
} from './dto/create-scale-up-trial.dto';

function normalizeUploadedFilePath(filePath: string): string {
  if (!filePath) return '';

  return `/${filePath
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')}`;
}

@Controller('contract-projects/:projectId/scale-up-trial')
export class ScaleUpTrialController {
  constructor(private readonly scaleUpTrialService: ScaleUpTrialService) {}

  /**
   * ایجاد رکورد جدید Scale-up Trial برای یک پروژه
   * همراه با آپلود فایل‌های report و manufacturingProcess
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'reportFile', maxCount: 1 },
        { name: 'manufacturingProcessFile', maxCount: 1 },
      ],
      getMulterOptions('step6-scale-up-trial'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep6ScaleUpTrialDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      reportFile?: Express.Multer.File[];
      manufacturingProcessFile?: Express.Multer.File[];
    },
  ) {
    // نکته: projectId از پارامتر route می‌آید؛ اگر dto هم projectId دارد، اینجا override می‌کنیم
    // تا همیشه مطابق URL باشد و کسی با Body دستکاری نکند.
    dto.projectId = projectId;

    if (files?.reportFile?.[0]?.path) {
      dto.reportFileUrl = normalizeUploadedFilePath(files.reportFile[0].path);
    }

    if (files?.manufacturingProcessFile?.[0]?.path) {
      dto.manufacturingProcessFileUrl = normalizeUploadedFilePath(
        files.manufacturingProcessFile[0].path,
      );
    }

    return this.scaleUpTrialService.create(projectId, dto, user);
  }

  /**
   * دریافت لیست Trialهای یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.scaleUpTrialService.findAllByProject(projectId, user);
  }

  /**
   * ویرایش یک رکورد Trial (بر اساس id) - امکان جایگزینی فایل‌ها
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'reportFile', maxCount: 1 },
        { name: 'manufacturingProcessFile', maxCount: 1 },
      ],
      getMulterOptions('step6-scale-up-trial'),
    ),
  )
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStep6ScaleUpTrialDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      reportFile?: Express.Multer.File[];
      manufacturingProcessFile?: Express.Multer.File[];
    },
  ) {
    if (files?.reportFile?.[0]?.path) {
      dto.reportFileUrl = normalizeUploadedFilePath(files.reportFile[0].path);
    }

    if (files?.manufacturingProcessFile?.[0]?.path) {
      dto.manufacturingProcessFileUrl = normalizeUploadedFilePath(
        files.manufacturingProcessFile[0].path,
      );
    }

    return this.scaleUpTrialService.update(id, projectId, dto, user);
  }

  /**
   * حذف یک رکورد Trial (بر اساس id)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.scaleUpTrialService.remove(id, projectId, user);
  }
}
