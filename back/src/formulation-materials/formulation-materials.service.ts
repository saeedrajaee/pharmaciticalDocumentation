import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep3stdDto,
  UpdateStep3stdDto,
} from './dto/create-formulation-materials.dto';

@Injectable()
export class FormulationMaterialsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * افزودن یک رکورد استاندارد جدید به پروژه
   */
  async create(
    projectId: number,
    data: CreateStep3stdDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی کاربر به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. ثبت داده در پایگاه داده
    return this.prisma.step3std.create({
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
   * دریافت لیست تمام رکوردهای یک پروژه
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step3std.findMany({
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
   * دریافت یک رکورد خاص
   */
  async findOne(coaId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    const coa = await this.prisma.step3std.findFirst({
      where: {
        id: coaId,
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

    if (!coa) {
      throw new NotFoundException('رکورد COA محصول نهایی مورد نظر یافت نشد');
    }

    return coa;
  }

  /**
   * ویرایش یک رکورد خاص
   */
  async update(
    coaId: number,
    projectId: number,
    data: UpdateStep3stdDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد در این پروژه
    const existing = await this.prisma.step3std.findFirst({
      where: {
        id: coaId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'رکورد COA محصول نهایی مورد نظر در این پروژه یافت نشد',
      );
    }

    // ۳. به‌روزرسانی اطلاعات
    return this.prisma.step3std.update({
      where: { id: coaId },
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
   * حذف یک رکورد
   */
  async remove(coaId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد برای حذف ایمن‌تر
    const existing = await this.prisma.step3std.findFirst({
      where: {
        id: coaId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException('رکورد COA محصول نهایی مورد نظر یافت نشد');
    }

    // ۳. حذف رکورد
    return this.prisma.step3std.delete({
      where: { id: coaId },
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
