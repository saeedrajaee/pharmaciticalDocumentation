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

import { CreatePackagingDto, UpdatePackagingDto } from './dto/create-pre-furmola-packaging.dto';
import { PreFurmolaPackagingService } from './pre-furmola-packaging.service';

function normalizeUploadedFilePath(filePath: string): string {
  if (!filePath) return '';

  return `/${filePath
    .replace(/\\/g, '/')
    .replace(/^\.?\//, '')
    .replace(/^\/+/, '')}`;
}

@Controller('contract-projects/:projectId/packaging')
export class PreFurmolaPackagingController {
  constructor(private readonly packagingService: PreFurmolaPackagingService) {}

  /**
   * Create a new Packaging record (with optional COA/URS file uploads)
   *
   * multipart/form-data:
   * - coaFile: File (optional)
   * - ursFile: File (optional)
   * - packaagingName: string
   * - manufactor: string (optional)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'coaFile', maxCount: 1 },
        { name: 'ursFile', maxCount: 1 },
      ],
      getMulterOptions('step4-packaging'),
    ),
  )
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreatePackagingDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      coaFile?: Express.Multer.File[];
      ursFile?: Express.Multer.File[];
    },
  ) {
    const coa = files?.coaFile?.[0];
    const urs = files?.ursFile?.[0];

    if (coa?.path) dto.coa = normalizeUploadedFilePath(coa.path);
    if (urs?.path) dto.urs = normalizeUploadedFilePath(urs.path);

    return this.packagingService.create(projectId, dto, user);
  }

  /**
   * Get all Packaging records of a project
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.packagingService.findAllByProject(projectId, user);
  }

  /**
   * Get a single Packaging record
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.packagingService.findOne(id, projectId, user);
  }

  /**
   * Update a Packaging record (with optional COA/URS file replacement)
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'coaFile', maxCount: 1 },
        { name: 'ursFile', maxCount: 1 },
      ],
      getMulterOptions('step4-packaging'),
    ),
  )
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePackagingDto,
    @CurrentUser() user: TokenPayload,
    @UploadedFiles()
    files?: {
      coaFile?: Express.Multer.File[];
      ursFile?: Express.Multer.File[];
    },
  ) {
    const coa = files?.coaFile?.[0];
    const urs = files?.ursFile?.[0];

    if (coa?.path) dto.coa = normalizeUploadedFilePath(coa.path);
    if (urs?.path) dto.urs = normalizeUploadedFilePath(urs.path);

    return this.packagingService.update(id, projectId, dto, user);
  }

  /**
   * Delete a Packaging record
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.packagingService.remove(id, projectId, user);
  }
}
