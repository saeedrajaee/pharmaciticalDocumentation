import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep6ScaleUpTrialDto,
  UpdateStep6ScaleUpTrialDto,
} from './dto/create-scale-up-trial.dto';

@Injectable()
export class ScaleUpTrialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ایجاد رکورد جدید Scale-up Trial برای یک پروژه
   */
  async create(
    projectId: number,
    data: CreateStep6ScaleUpTrialDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step6ScaleUpTrial.create({
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
   * دریافت تمام رکوردهای Trial یک پروژه
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step6ScaleUpTrial.findMany({
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
   * ویرایش یک رکورد خاص (بر اساس id)
   */
  async update(
    id: number,
    projectId: number,
    data: UpdateStep6ScaleUpTrialDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    // ابتدا دسترسی را چک می‌کنیم
    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step6ScaleUpTrial.findFirst({
      where: { id, projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی با این شناسه برای پروژه یافت نشد');
    }

    return this.prisma.step6ScaleUpTrial.update({
      where: { id },
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
   * حذف یک رکورد خاص (بر اساس id)
   */
  async remove(id: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step6ScaleUpTrial.findFirst({
      where: { id, projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی با این شناسه برای پروژه یافت نشد');
    }

    return this.prisma.step6ScaleUpTrial.delete({
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
