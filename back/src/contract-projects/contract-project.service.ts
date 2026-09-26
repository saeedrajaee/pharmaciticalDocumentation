import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import { CreateContractProjectDto } from './dto/create-contract-project.dto';
import { UpdateContractProjectDto } from './dto/update-create-contract-project.dto';

@Injectable()
export class ContractProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateContractProjectDto, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    const ownerId =
      user.role === Role.ADMIN && data.userId ? data.userId : user.sub;

    if (data.userId && user.role !== Role.ADMIN && data.userId !== user.sub) {
      throw new BadRequestException('اجازه ثبت برای کاربر دیگر را ندارید');
    }

    if (data.userId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new NotFoundException('کاربر مورد نظر یافت نشد');
      }
    }

    // جدا کردن userId از سایر فیلدهای DTO جهت جلوگیری از ارسال فیلد مستقیم به prisma
    const { userId, ...projectData } = data;

    return this.prisma.contractProject.create({
      data: {
        ...projectData,
        user: { connect: { id: ownerId } },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
      },
    });
  }

  async findAll(user: TokenPayload) {
    const where = user.role === Role.ADMIN ? {} : { userId: user.sub };

    return this.prisma.contractProject.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, user: TokenPayload) {
    const where = user.role === Role.ADMIN ? { id } : { id, userId: user.sub };

    const contractProject = await this.prisma.contractProject.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
      },
    });

    if (!contractProject) {
      throw new NotFoundException('پروژه قراردادی یافت نشد');
    }

    return contractProject;
  }

  async update(
    id: number,
    data: UpdateContractProjectDto,
    user: TokenPayload,
  ) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.contractProject.findFirst({
      where: whereCondition,
    });

    if (!existing) {
      throw new NotFoundException('پروژه قراردادی یافت نشد یا دسترسی ندارید');
    }

    let ownerId = existing.userId;

    if (typeof data.userId !== 'undefined') {
      if (user.role !== Role.ADMIN) {
        throw new BadRequestException('اجازه تغییر مالک پرونده را ندارید');
      }

      const targetUser = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new NotFoundException('کاربر مورد نظر یافت نشد');
      }

      ownerId = data.userId;
    }

    const { userId, ...projectData } = data;

    return this.prisma.contractProject.update({
      where: { id },
      data: {
        ...projectData,
        userId: ownerId ?? null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
      },
    });
  }

  async remove(id: number, user: TokenPayload) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.contractProject.findFirst({
      where: whereCondition,
    });

    if (!existing) {
      throw new NotFoundException('پروژه قراردادی یافت نشد یا دسترسی ندارید');
    }

    return this.prisma.contractProject.delete({
      where: { id },
    });
  }
}
