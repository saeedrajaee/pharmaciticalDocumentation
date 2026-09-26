import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PreFurmolaService } from './pre-furmola.service';
import {
  CreatePreFormulationDto,
  UpdatePreFormulationDto,
} from './dto/create-pre-furmola.dto'; // مسیر فایل DTO را در صورت نیاز تطبیق دهید

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Controller('contract-projects/:projectId/pre-formulation')
export class PreFurmolaController {
  constructor(private readonly preFurmolaService: PreFurmolaService) {}

  /**
   * ایجاد رکورد جدید پیش‌فرمولاسیون همراه با لیست جزئیات (ثبت‌شده از مودال دوم)
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreatePreFormulationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.preFurmolaService.create(projectId, dto, user);
  }

  /**
   * دریافت تمامی رکوردهای پیش‌فرمولاسیون یک پروژه به همراه جزئیات
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.preFurmolaService.findAllByProject(projectId, user);
  }

  /**
   * دریافت جزئیات یک فرمولاسیون خاص همراه با سطرهای اجزا
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.preFurmolaService.findOne(id, projectId, user);
  }

  /**
   * ویرایش فرمول پیش‌فرمولاسیون و به‌روزرسانی لیست جزئیات
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePreFormulationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.preFurmolaService.update(id, projectId, dto, user);
  }

  /**
   * حذف یک رکورد پیش‌فرمولاسیون (جزئیات به صورت Cascade حذف می‌شوند)
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.preFurmolaService.remove(id, projectId, user);
  }
}
