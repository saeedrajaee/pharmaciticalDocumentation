import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep7FormulationDevelopmentDto,
  UpdateStep7FormulationDevelopmentDto,
} from './dto/create-furmolation-develop.dto';

@Injectable()
export class FurmolationDevelopService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * افزودن رکورد Formulation Development به پروژه
   */
  async create(
    projectId: number,
    data: CreateStep7FormulationDevelopmentDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step7FurmolationDevelopment.create({
      data: {
        ...data,
        projectId,
        userId: user.sub,
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

  /**
   * دریافت تمام رکوردهای Formulation Development یک پروژه
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step7FurmolationDevelopment.findMany({
      where: { projectId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * دریافت یک رکورد Formulation Development در پروژه
   */
  async findOne(
    recordId: number,
    projectId: number,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    await this.ensureUserHasAccessToProject(projectId, user);

    const record = await this.prisma.step7FurmolationDevelopment.findFirst({
      where: {
        id: recordId,
        projectId,
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

    if (!record) {
      throw new NotFoundException('رکورد مورد نظر در این پروژه یافت نشد');
    }

    return record;
  }

  /**
   * ویرایش یک رکورد Formulation Development
   */
  async update(
    recordId: number,
    projectId: number,
    data: UpdateStep7FormulationDevelopmentDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step7FurmolationDevelopment.findFirst({
      where: {
        id: recordId,
        projectId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکورد مورد نظر در این پروژه یافت نشد');
    }

    return this.prisma.step7FurmolationDevelopment.update({
      where: { id: recordId },
      data,
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

  /**
   * حذف یک رکورد Formulation Development
   */
  async remove(
    recordId: number,
    projectId: number,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step7FurmolationDevelopment.findFirst({
      where: {
        id: recordId,
        projectId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکورد مورد نظر در این پروژه یافت نشد');
    }

    return this.prisma.step7FurmolationDevelopment.delete({
      where: { id: recordId },
    });
  }

  /**
   * بررسی دسترسی کاربر به پروژه
   */
  private async ensureUserHasAccessToProject(
    projectId: number,
    user: TokenPayload,
  ) {
    const whereCondition: { id: number; userId?: number } = {
      id: projectId,
    };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const project = await this.prisma.contractProject.findFirst({
      where: whereCondition,
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(
        'پروژه قراردادی یافت نشد یا شما دسترسی لازم به آن را ندارید',
      );
    }
  }
}
