import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep5AnalyticalDevlopRawDto,
  UpdateStep5Step5AnalyticalDevlopRawDto,
} from './dto/create-analytical-devlop-raw.dto';

@Injectable()
export class AnalyticalDevlopRawService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * افزودن یک رکورد Analytical Develop Raw جدید به پروژه
   */
  async create(
    projectId: number,
    data: CreateStep5AnalyticalDevlopRawDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی کاربر به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. ثبت داده در پایگاه داده
    return this.prisma.step5AnalyticalDevlopRaw.create({
      data: {
        ...data,
        projectId, // اختصاص شناسه پروژه از پارامتر مسیر
        userId: user.sub, // ثبت خودکار کاربر سازنده رکورد
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
   * دریافت لیست تمام رکوردهای Analytical Develop Raw یک پروژه
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step5AnalyticalDevlopRaw.findMany({
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
   * دریافت جزئیات یک رکورد Analytical Develop Raw خاص
   */
  async findOne(rawId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    const raw = await this.prisma.step5AnalyticalDevlopRaw.findFirst({
      where: {
        id: rawId,
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

    if (!raw) {
      throw new NotFoundException('رکورد مورد نظر یافت نشد');
    }

    return raw;
  }

  /**
   * ویرایش یک رکورد Analytical Develop Raw خاص
   */
  async update(
    rawId: number,
    projectId: number,
    data: UpdateStep5Step5AnalyticalDevlopRawDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد در این پروژه
    const existing = await this.prisma.step5AnalyticalDevlopRaw.findFirst({
      where: {
        id: rawId,
        projectId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکورد مورد نظر در این پروژه یافت نشد');
    }

    // ۳. به‌روزرسانی اطلاعات
    return this.prisma.step5AnalyticalDevlopRaw.update({
      where: { id: rawId },
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
   * حذف یک رکورد Analytical Develop Raw
   */
  async remove(rawId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد
    const existing = await this.prisma.step5AnalyticalDevlopRaw.findFirst({
      where: {
        id: rawId,
        projectId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکورد مورد نظر یافت نشد');
    }

    // ۳. حذف رکورد
    return this.prisma.step5AnalyticalDevlopRaw.delete({
      where: { id: rawId },
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
