import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role, StabilityStage } from '@prisma/client';

import { ContractBatchService } from './contract-batch.service';
import {
  CreateContractBatchDto,
  UpdateContractBatchDto,
} from './dto/create-contract-batch.dto';

import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Controller('contract-projects/:projectId/contract-batches')
export class ContractBatchController {
  constructor(
    private readonly contractBatchService: ContractBatchService,
  ) {}

  /**
   * ایجاد بچ پایداری برای یک پروژه
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Param('projectId', ParseIntPipe) projectId: number,
    @Body() dto: CreateContractBatchDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractBatchService.create(projectId, dto, user);
  }

  /**
   * دریافت بچ‌های یک پروژه
   * فیلتر اختیاری: ?stage=FINISHED_PRODUCT
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  findAllByProject(
    @Param('projectId', ParseIntPipe) projectId: number,
    @CurrentUser() user: TokenPayload,
    @Query(
      'stage',
      new ParseEnumPipe(StabilityStage, { optional: true }),
    )
    stage?: StabilityStage,
  ) {
    return this.contractBatchService.findAllByProject(
      projectId,
      user,
      stage,
    );
  }

  /**
   * دریافت یک بچ بر اساس شناسه
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractBatchService.findOne(id, user);
  }

  /**
   * ویرایش یک بچ بر اساس شناسه
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractBatchDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractBatchService.update(id, dto, user);
  }

  /**
   * حذف یک بچ بر اساس شناسه
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractBatchService.remove(id, user);
  }
}
