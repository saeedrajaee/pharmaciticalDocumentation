import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { hash } from 'argon2';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createUserDto: CreateUserDto) {
    const { password, ...user } = createUserDto;
    const hashPassword = await hash(password);
    return await this.prisma.user.create({
      data: {
        password: hashPassword,
        ...user,
      },
    });
  }
  async findByMobile(mobile: string) {
    return await this.prisma.user.findUnique({
      where: {
        mobile,
      },
    });
  }
  async findOne(userId: number) {
    return await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async updateHashedRefreshToken(userId: number, hashRT: string | null) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRefreshToken: hashRT,
      },
    });
  }
}
