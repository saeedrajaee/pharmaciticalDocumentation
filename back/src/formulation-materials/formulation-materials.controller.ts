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

import { FormulationMaterialsService } from './formulation-materials.service';
import {
  CreateStep3stdDto,
  UpdateStep3stdDto,
} from './dto/create-formulation-materials.dto';

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

@Controller('contract-projects/:projectId/finished-coa')
export class FormulationMaterialsController {
  constructor(private readonly formulationMaterialsService: FormulationMaterialsService) {}

  /**
   * ایجاد رکورد جدید Step3std همراه با آپلود فایل
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('step3-finished-coa')))
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep3stdDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.path) {
      dto.stdFileUrl = normalizeUploadedFilePath(file.path);
    }

    return this.formulationMaterialsService.create(projectId, dto, user);
  }

  /**
   * دریافت تمامی رکوردهای Step3std یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.formulationMaterialsService.findAllByProject(projectId, user);
  }

  /**
   * دریافت جزئیات یک رکورد Step3std خاص
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.formulationMaterialsService.findOne(id, projectId, user);
  }

  /**
   * ویرایش رکورد Step3std همراه با امکان جایگزینی یا افزودن فایل
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('step3-finished-coa')))
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStep3stdDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.path) {
      dto.stdFileUrl = normalizeUploadedFilePath(file.path);
    }

    return this.formulationMaterialsService.update(id, projectId, dto, user);
  }

  /**
   * حذف یک رکورد Step3std
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.formulationMaterialsService.remove(id, projectId, user);
  }
}
