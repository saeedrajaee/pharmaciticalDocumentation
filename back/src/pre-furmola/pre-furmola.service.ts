import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreatePreFormulationDto,
  UpdatePreFormulationDto,
} from './dto/create-pre-furmola.dto';

@Injectable()
export class PreFurmolaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ثبت اطلاعات پیش‌فرمولاسیون به همراه جزئیات (ثبت شده از مودال دوم)
   */
  async create(
    projectId: number,
    dto: CreatePreFormulationDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی کاربر به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    const { parts, ...data } = dto;

    // ۲. ایجاد رکورد اصلی و رکوردهای جدول جزئیات
    return this.prisma.step4PreFormulation.create({
      data: {
        ...data,
        projectId,
        userId: user.sub,
        step4PreFormulationParts: parts && parts.length > 0
          ? {
              create: parts.map((part) => ({
                componentsName: part.componentsName,
                componentsAmount: part.componentsAmount,
                componentsRole: part.componentsRole,
                manufacturingProcess: part.manufacturingProcess,
                userId: user.sub,
              })),
            }
          : undefined,
      },
      include: {
        step4PreFormulationParts: true,
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
   * دریافت لیست تمام رکوردهای پیش‌فرمولاسیون یک پروژه به همراه جزئیات کامل
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step4PreFormulation.findMany({
      where: { projectId },
      include: {
        step4PreFormulationParts: {
          orderBy: {
            createdAt: 'asc',
          },
        },
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
   * دریافت اطلاعات یک فرمول خاص به همراه اقلام و اجزای مودال
   */
  async findOne(id: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    await this.ensureUserHasAccessToProject(projectId, user);

    const record = await this.prisma.step4PreFormulation.findFirst({
      where: {
        id,
        projectId,
      },
      include: {
        step4PreFormulationParts: {
          orderBy: {
            createdAt: 'asc',
          },
        },
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
      throw new NotFoundException('اطلاعات پیش‌فرمولاسیون مورد نظر یافت نشد');
    }

    return record;
  }

  /**
   * ویرایش رکورد پیش‌فرمولاسیون و همگام‌سازی جزئیات
   */
  async update(
    id: number,
    projectId: number,
    dto: UpdatePreFormulationDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد در این پروژه
    const existing = await this.prisma.step4PreFormulation.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException(
        'اطلاعات پیش‌فرمولاسیون مورد نظر در این پروژه یافت نشد',
      );
    }

    const { parts, ...data } = dto;

    // ۳. به‌روزرسانی اتمیک درون تراکنش دیتابیس
    return this.prisma.$transaction(async (tx) => {
      // در صورت ارسال آرایه جدید اجزا، رکوردهای قبلی پاک شده و جدیدها درج می‌شوند
      if (parts !== undefined) {
        await tx.step4PreFormulationPart.deleteMany({
          where: { step4PreFormulationId: id },
        });
      }

      return tx.step4PreFormulation.update({
        where: { id },
        data: {
          ...data,
          step4PreFormulationParts:
            parts && parts.length > 0
              ? {
                  create: parts.map((part) => ({
                    componentsName: part.componentsName,
                    componentsAmount: part.componentsAmount,
                    componentsRole: part.componentsRole,
                    manufacturingProcess: part.manufacturingProcess,
                    userId: user.sub,
                  })),
                }
              : undefined,
        },
        include: {
          step4PreFormulationParts: true,
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
    });
  }

  /**
   * حذف رکورد اصلی پیش‌فرمولاسیون (پارت‌ها بر اساس cascade در دیتابیس حذف می‌شوند)
   */
  async remove(id: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step4PreFormulation.findFirst({
      where: {
        id,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException('رکورد پیش‌فرمولاسیون مورد نظر یافت نشد');
    }

    return this.prisma.step4PreFormulation.delete({
      where: { id },
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

    // اگر کاربر ادمین نباشد، فقط به پروژه‌های اختصاص داده شده به خودش دسترسی دارد
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
