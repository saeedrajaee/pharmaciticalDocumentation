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

import { BomService } from './bom.service'; // سرویس مربوط به Step2FormulaBom
import {
  CreateStep2FormulaBomDto,
  UpdateStep2FormulaBomDto,
} from './dto/create-bom.dto'; // آدرس DTOهای مربوطه

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

@Controller('contract-projects/:projectId/bom')
export class BomController {
  constructor(private readonly formulaBomService: BomService) {}

  /**
   * ایجاد رکورد جدید BOM همراه با آپلود فایل
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('step2-formula-bom')))
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep2FormulaBomDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.path) {
      dto.bomFileUrl = normalizeUploadedFilePath(file.path);
    }

    return this.formulaBomService.create(projectId, dto, user);
  }

  /**
   * دریافت تمامی رکوردهای BOM یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.formulaBomService.findAllByProject(projectId, user);
  }

  /**
   * دریافت جزئیات یک رکورد BOM خاص
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.formulaBomService.findOne(id, projectId, user);
  }

  /**
   * ویرایش رکورد BOM همراه با امکان جایگزینی فایل
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(FileInterceptor('file', getMulterOptions('step2-formula-bom')))
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStep2FormulaBomDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file?.path) {
      dto.bomFileUrl = normalizeUploadedFilePath(file.path);
    }

    return this.formulaBomService.update(id, projectId, dto, user);
  }

  /**
   * حذف یک رکورد BOM
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.formulaBomService.remove(id, projectId, user);
  }
}
