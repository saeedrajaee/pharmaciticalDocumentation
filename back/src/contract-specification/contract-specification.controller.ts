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

import { ContractSpecificationService } from './contract-specification.service';
import {
  CreateContractSpecificationDto,
  UpdateContractSpecificationDto,
} from './dto/create-contract-specification.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Controller('contract-specification')
export class ContractSpecificationController {
  constructor(
    private readonly contractSpecificationService: ContractSpecificationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Body() dto: CreateContractSpecificationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractSpecificationService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.contractSpecificationService.findAll(user);
  }

  // این مسیر باید قبل از @Get(':id') تعریف شود.
  @Get('project/:projectId')
  @UseGuards(JwtAuthGuard)
  findByProjectId(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractSpecificationService.findByProjectId(projectId, user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractSpecificationService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractSpecificationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractSpecificationService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractSpecificationService.remove(id, user);
  }
}
