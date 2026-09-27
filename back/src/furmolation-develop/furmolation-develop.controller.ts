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

import { FurmolationDevelopService } from './furmolation-develop.service';
import {
  CreateStep7FormulationDevelopmentDto,
  UpdateStep7FormulationDevelopmentDto,
} from './dto/create-furmolation-develop.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

/**
 * مسیر استاندارد پروژه-محور مشابه سایر مراحل سیستم
 */
@Controller('contract-projects/:projectId/furmolation-develop')
export class FurmolationDevelopController {
  constructor(
    private readonly furmolationDevelopService: FurmolationDevelopService,
  ) {}

  /**
   * ایجاد رکورد جدید Formulation Development در پروژه
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateStep7FormulationDevelopmentDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.furmolationDevelopService.create(projectId, dto, user);
  }

  /**
   * دریافت تمام رکوردهای Formulation Development یک پروژه
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.furmolationDevelopService.findAllByProject(projectId, user);
  }

  /**
   * دریافت جزئیات یک رکورد خاص بر اساس شناسه (id)
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.furmolationDevelopService.findOne(id, projectId, user);
  }

  /**
   * ویرایش یک رکورد Formulation Development
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  update(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStep7FormulationDevelopmentDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.furmolationDevelopService.update(id, projectId, dto, user);
  }

  /**
   * حذف یک رکورد Formulation Development
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.furmolationDevelopService.remove(id, projectId, user);
  }
}
