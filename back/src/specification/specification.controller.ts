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
import { SpecificationService } from './specification.service';
import { CreateSpecificationDto } from './dto/create-specification.dto';
import { UpdateSpecificationDto } from './dto/update-specification.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles/roles.guard';
import { Roles } from 'src/auth/decorator/roles.decorator';
import { CurrentUser } from 'src/auth/decorator/current-user.decorator';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Controller('specification')
export class SpecificationController {
  constructor(
    private readonly specificationService: SpecificationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  create(
    @Body() dto: CreateSpecificationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.specificationService.create(dto, user);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@CurrentUser() user: TokenPayload) {
    return this.specificationService.findAll(user);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.specificationService.findOne(id, user);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSpecificationDto,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.specificationService.update(id, dto, user);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.USER)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: TokenPayload,
  ) {
    return this.specificationService.remove(id, user);
  }
}
