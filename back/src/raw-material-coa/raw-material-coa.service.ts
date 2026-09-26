import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep3RawMaterialCoaDto,
  UpdateStep3RawMaterialCoaDto,
} from './dto/create-raw-material-coa.dto';

@Injectable()
export class RawMaterialCoaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * افزودن یک رکورد COA جدید به پروژه
   */
  async create(
    projectId: number,
    data: CreateStep3RawMaterialCoaDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی کاربر به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. ثبت داده در پایگاه داده
    return this.prisma.step3RawMaterialCoa.create({
      data: {
        ...data,
        projectId,
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
   * دریافت لیست تمام رکوردهای COA یک پروژه
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step3RawMaterialCoa.findMany({
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
   * دریافت جزئیات یک رکورد COA خاص
   */
  async findOne(coaId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    const coa = await this.prisma.step3RawMaterialCoa.findFirst({
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
      throw new NotFoundException('رکورد COA مورد نظر یافت نشد');
    }

    return coa;
  }

  /**
   * ویرایش یک رکورد COA خاص
   */
  async update(
    coaId: number,
    projectId: number,
    data: UpdateStep3RawMaterialCoaDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد COA در این پروژه
    const existing = await this.prisma.step3RawMaterialCoa.findFirst({
      where: {
        id: coaId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException('رکورد COA مورد نظر در این پروژه یافت نشد');
    }

    // ۳. به‌روزرسانی اطلاعات
    return this.prisma.step3RawMaterialCoa.update({
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
   * حذف یک رکورد COA
   */
  async remove(coaId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد
    const existing = await this.prisma.step3RawMaterialCoa.findFirst({
      where: {
        id: coaId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException('رکورد COA مورد نظر یافت نشد');
    }

    // ۳. حذف رکورد
    return this.prisma.step3RawMaterialCoa.delete({
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
