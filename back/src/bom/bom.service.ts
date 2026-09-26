import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep2FormulaBomDto,
  UpdateStep2FormulaBomDto,
} from './dto/create-bom.dto';

@Injectable()
export class BomService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * افزودن یک رکورد BOM جدید به پروژه
   */
  async create(
    projectId: number,
    data: CreateStep2FormulaBomDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی کاربر به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. ثبت داده در پایگاه داده
    return this.prisma.step2FormulaBom.create({
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
   * دریافت لیست تمام رکوردهای BOM یک پروژه
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step2FormulaBom.findMany({
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
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * دریافت جزئیات یک رکورد BOM خاص
   */
  async findOne(bomId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    const bom = await this.prisma.step2FormulaBom.findFirst({
      where: {
        id: bomId,
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

    if (!bom) {
      throw new NotFoundException('رکورد Formula BOM مورد نظر یافت نشد');
    }

    return bom;
  }

  /**
   * ویرایش یک رکورد خاص BOM
   */
  async update(
    bomId: number,
    projectId: number,
    data: UpdateStep2FormulaBomDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد در این پروژه
    const existing = await this.prisma.step2FormulaBom.findFirst({
      where: {
        id: bomId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'رکورد Formula BOM مورد نظر در این پروژه یافت نشد',
      );
    }

    // ۳. به‌روزرسانی اطلاعات
    return this.prisma.step2FormulaBom.update({
      where: { id: bomId },
      data: {
        ...data,
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
   * حذف یک رکورد BOM
   */
  async remove(bomId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد برای حذف ایمن‌تر
    const existing = await this.prisma.step2FormulaBom.findFirst({
      where: {
        id: bomId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException('رکورد Formula BOM مورد نظر یافت نشد');
    }

    // ۳. حذف رکورد
    return this.prisma.step2FormulaBom.delete({
      where: { id: bomId },
    });
  }

  /**
   * متد کمکی برای بررسی دسترسی کاربر به پروژه
   */
  private async ensureUserHasAccessToProject(
    projectId: number,
    user: TokenPayload,
  ) {
    const whereCondition: any = { id: projectId };

    // اگر کاربر ادمین نباشد، فقط به پروژه‌های خودش دسترسی دارد
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
