import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { ContractResultService } from './contract-result.service';
import { CreateContractResultDto, UpdateContractResultDto } from './dto/create-contract-result.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Controller('contract-result')
export class ContractResultController {
  constructor(
    private readonly contractResultService: ContractResultService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Body() dto: CreateContractResultDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractResultService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Query('batchId') batchId?: string) {
    const parsedBatchId = batchId ? parseInt(batchId, 10) : undefined;
    return this.contractResultService.findAll(parsedBatchId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contractResultService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractResultDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractResultService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractResultService.remove(id, user);
  }
}
