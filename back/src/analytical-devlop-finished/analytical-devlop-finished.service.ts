import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep5AnalyticalDevlopFinishedDto,
  UpdateStep5AnalyticalDevlopFinishedDto,
} from './dto/create-analytical-devlop-finished.dto';

@Injectable()
export class AnalyticalDevlopFinishedService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ایجاد رکورد Finished برای یک پروژه (هر پروژه فقط یک رکورد دارد)
   */
  async create(
    projectId: number,
    data: CreateStep5AnalyticalDevlopFinishedDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    // به دلیل projectId @unique بررسی می‌کنیم قبلاً رکورد ساخته نشده باشد
    const existing = await this.prisma.step5AnalyticalDevlopFinished.findUnique({
      where: { projectId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'برای این پروژه قبلاً اطلاعات آنالیز (Finished) ثبت شده است',
      );
    }

    return this.prisma.step5AnalyticalDevlopFinished.create({
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
   * دریافت رکورد Finished یک پروژه
   */
  async findOneByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const finished = await this.prisma.step5AnalyticalDevlopFinished.findUnique({
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
   * ویرایش رکورد Finished یک پروژه (بر اساس projectId)
   */
  async updateByProject(
    projectId: number,
    data: UpdateStep5AnalyticalDevlopFinishedDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step5AnalyticalDevlopFinished.findUnique({
      where: { projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return this.prisma.step5AnalyticalDevlopFinished.update({
      // چون projectId unique است، می‌توانیم مستقیم با projectId آپدیت کنیم
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
   * حذف رکورد Finished یک پروژه
   */
  async removeByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step5AnalyticalDevlopFinished.findUnique({
      where: { projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return this.prisma.step5AnalyticalDevlopFinished.delete({
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
