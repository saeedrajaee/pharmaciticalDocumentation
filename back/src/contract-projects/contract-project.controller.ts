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
import { ContractProjectService } from './contract-project.service';
import { CreateContractProjectDto } from './dto/create-contract-project.dto';
import { UpdateContractProjectDto } from './dto/update-create-contract-project.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Controller('contract-projects')
export class ContractProjectController {
  constructor(
    private readonly contractProjectService: ContractProjectService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Body() dto: CreateContractProjectDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractProjectService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.contractProjectService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractProjectService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateContractProjectDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractProjectService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.contractProjectService.remove(id, user);
  }
}
