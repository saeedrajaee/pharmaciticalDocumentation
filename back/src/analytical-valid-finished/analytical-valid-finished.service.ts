import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep6AnalyticalValidFinishedDto,
  UpdateStep6AnalyticalValidFinishedDto,
} from './dto/create-analytical-valid-finished.dto';

@Injectable()
export class AnalyticalValidFinishedService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ایجاد رکورد Step6 Analytical Valid Finished برای یک پروژه
   * (هر پروژه فقط یک رکورد دارد چون projectId در مدل @unique است)
   */
  async create(
    projectId: number,
    data: CreateStep6AnalyticalValidFinishedDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    // بررسی اینکه قبلاً برای این پروژه رکورد ساخته نشده باشد
    const existing = await this.prisma.step6AnalyticalValidFinished.findUnique({
      where: { projectId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'برای این پروژه قبلاً اطلاعات آنالیز (Valid Finished) ثبت شده است',
      );
    }

    return this.prisma.step6AnalyticalValidFinished.create({
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
   * دریافت رکورد Step6 Analytical Valid Finished یک پروژه
   */
  async findOneByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const finished =
      await this.prisma.step6AnalyticalValidFinished.findUnique({
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
      });

    if (!finished) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return finished;
  }

  /**
   * ویرایش رکورد Step6 Analytical Valid Finished یک پروژه (بر اساس projectId)
   */
  async updateByProject(
    projectId: number,
    data: UpdateStep6AnalyticalValidFinishedDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step6AnalyticalValidFinished.findUnique({
      where: { projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return this.prisma.step6AnalyticalValidFinished.update({
      // چون projectId unique است، مستقیم با projectId آپدیت می‌کنیم
      where: { projectId },
      data: {
        ...data,
        // اگر می‌خواهید آخرین ویرایش‌کننده ثبت شود:
        // userId: user.sub,
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
   * حذف رکورد Step6 Analytical Valid Finished یک پروژه
   */
  async removeByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step6AnalyticalValidFinished.findUnique({
      where: { projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return this.prisma.step6AnalyticalValidFinished.delete({
      where: { projectId },
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
