import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Res,
  SetMetadata,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LocalAuthGuard } from './guards/local-auth/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth/jwt-auth.guard';
import { RefreshAuthGuard } from './guards/refresh-auth/refresh-auth.guard';
import { Response } from 'express';
import { Public } from './decorator/public.decorator';
import { Roles } from './decorator/roles.decorator';
import { RolesGuard } from './guards/roles/roles.guard';
import { Role } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
  @Post('signup')
  registerUser(@Body() createUserDto: CreateUserDto) {
    console.log("createUserDto..............",createUserDto)
    return this.authService.registerUser(createUserDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('signin')
  login(@Request() req) {
    console.log('LOGIN USER:', req.user);
    return this.authService.login(req.user.id, req.user.name, req.user.role);
  }

  // @UseGuards(JwtAuthGuard)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.USER)
@Get('protected')
  getAll(@Request() req) {
    return {
      message: `Now you can access this protected API. this is your user ID: ${req.user.id}`,
    };
  }

  @Public()
  @UseGuards(RefreshAuthGuard)
  @Post('refresh')
  refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user.id, req.user.name);
  }

@UseGuards(JwtAuthGuard)
@Post('signout')
signOut(@Request() req) {
  return this.authService.signOut(req.user.id);
}
}
