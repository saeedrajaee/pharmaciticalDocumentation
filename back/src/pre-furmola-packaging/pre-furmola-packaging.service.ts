import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { TokenPayload } from 'src/auth/token-payload.interface';

import { CreatePackagingDto, UpdatePackagingDto } from './dto/create-pre-furmola-packaging.dto';

@Injectable()
export class PreFurmolaPackagingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * افزودن یک رکورد Packaging جدید به پروژه
   */
  async create(projectId: number, data: CreatePackagingDto, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی کاربر به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. ثبت داده در پایگاه داده
    return this.prisma.step4Packaging.create({
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
   * دریافت لیست تمام رکوردهای Packaging یک پروژه
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step4Packaging.findMany({
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
   * دریافت جزئیات یک رکورد Packaging خاص
   */
  async findOne(packagingId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    const packaging = await this.prisma.step4Packaging.findFirst({
      where: {
        id: packagingId,
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

    if (!packaging) {
      throw new NotFoundException('رکورد Packaging مورد نظر یافت نشد');
    }

    return packaging;
  }

  /**
   * ویرایش یک رکورد خاص Packaging
   */
  async update(
    packagingId: number,
    projectId: number,
    data: UpdatePackagingDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد در این پروژه
    const existing = await this.prisma.step4Packaging.findFirst({
      where: {
        id: packagingId,
        projectId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(
        'رکورد Packaging مورد نظر در این پروژه یافت نشد',
      );
    }

    // ۳. به‌روزرسانی اطلاعات
    return this.prisma.step4Packaging.update({
      where: { id: packagingId },
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
   * حذف یک رکورد Packaging
   */
  async remove(packagingId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد برای حذف ایمن‌تر
    const existing = await this.prisma.step4Packaging.findFirst({
      where: {
        id: packagingId,
        projectId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکورد Packaging مورد نظر یافت نشد');
    }

    // ۳. حذف رکورد
    return this.prisma.step4Packaging.delete({
      where: { id: packagingId },
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
