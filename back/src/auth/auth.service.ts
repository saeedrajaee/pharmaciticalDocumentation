import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateUserDto } from 'src/user/dto/create-user.dto';
import { UserService } from 'src/user/user.service';
import refreshConfig from './config/refresh.config';
import { JwtService } from '@nestjs/jwt';
import type { ConfigType } from '@nestjs/config';
import { hash, verify } from 'argon2';
import type { AuthJwtPayload } from './types/auth.jwtPayload';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @Inject(refreshConfig.KEY)
    private readonly refreshTokenConfig: ConfigType<typeof refreshConfig>,
  ) {}

  async registerUser(createUserDto: CreateUserDto) {
    const existingUser = await this.userService.findByMobile(
      createUserDto.mobile,
    );

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    return this.userService.create(createUserDto);
  }
async validateUser(mobile: string, password: string) {

  const user = await this.userService.findByMobile(mobile);
  console.log("RAW PASSWORD:", password);
  console.log("HASH FROM DB:", user?.password);
  if (!user) {
    throw new UnauthorizedException('User not found');
  }

  const passwordMatch = await verify(user.password, password);
console.log("MATCH RESULT:", passwordMatch);
  if (!passwordMatch) {
    throw new UnauthorizedException('Invalid password');
  }

  return user;
}



async login(userId: number, name: string, role: Role) {

  const tokens = await this.generateTokens(userId, role);

  const hashedRefreshToken = await hash(tokens.refreshToken);

  await this.userService.updateHashedRefreshToken(
    userId,
    hashedRefreshToken,
  );

  return {
    id: userId,
    name,
    role,
    ...tokens,
  };
}


async generateTokens(userId: number, role: Role) {
console.log('JWT_SECRET:', process.env.JWT_SECRET);
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET);
const payload = {
  sub: userId,
  role: role,
};

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '7d',
    }),

    this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    }),
  ]);

  return { accessToken, refreshToken };
}


  async validateJwtUser(userId: number) {
    const user = await this.userService.findOne(userId);

    if (!user) throw new UnauthorizedException('User not found');

    return { id: user.id, role: user.role };
  }

  async validateRefreshToken(userId: number, refreshToken: string) {
    const user = await this.userService.findOne(userId);

    if (!user || !user.hashedRefreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const refreshTokenMatched = await verify(
      user.hashedRefreshToken,
      refreshToken,
    );

    if (!refreshTokenMatched)
      throw new UnauthorizedException('Invalid Refresh Token');

    return { id: user.id };
  }

  async refreshToken(userId: number, name: string) {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = await this.generateTokens(userId, user.role);

    const hashedRefreshToken = await hash(tokens.refreshToken);

    await this.userService.updateHashedRefreshToken(userId, hashedRefreshToken);

    return {
      id: userId,
      name,
      role: user.role,
      ...tokens,
    };
  }

  async signOut(userId: number) {
    return this.userService.updateHashedRefreshToken(userId, null);
  }
}
