import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep7ScaleUpFinalDto,
  UpdateStep7ScaleUpFinalDto,
} from './dto/create-scale-up-final.dto';

@Injectable()
export class ScaleUpFinalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ایجاد رکورد ScaleUpFinal برای یک پروژه (هر پروژه فقط یک رکورد دارد)
   */
  async create(
    projectId: number,
    data: CreateStep7ScaleUpFinalDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    // چون برای هر پروژه فقط یک رکورد داریم، قبلش چک می‌کنیم ساخته نشده باشد
    const existing = await this.prisma.step7ScaleUpFinal.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException(
        'برای این پروژه قبلاً اطلاعات ScaleUp Final ثبت شده است',
      );
    }

    return this.prisma.step7ScaleUpFinal.create({
      data: {
        productionTechnologyTransferDocumentFileUrl:
          data.productionTechnologyTransferDocumentFileUrl,
        technologyTransferDocumentQCFileUrl:
          data.technologyTransferDocumentQCFileUrl,
        projectId,
        userId: user.sub,
      },
      include: {
        user: {
          select: { id: true, name: true, mobile: true, role: true },
        },
      },
    });
  }

  /**
   * دریافت رکورد ScaleUpFinal یک پروژه
   */
  async findOneByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const result = await this.prisma.step7ScaleUpFinal.findFirst({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, mobile: true, role: true },
        },
      },
    });

    if (!result) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return result;
  }

  /**
   * ویرایش رکورد ScaleUpFinal یک پروژه (بر اساس projectId)
   */
  async updateByProject(
    projectId: number,
    data: UpdateStep7ScaleUpFinalDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step7ScaleUpFinal.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return this.prisma.step7ScaleUpFinal.update({
      // چون projectId در اسکیما unique نیست، با id آپدیت می‌کنیم
      // (این الگو از خطای Prisma جلوگیری می‌کند)
      where: { id: existing.id },
      data: {
        productionTechnologyTransferDocumentFileUrl:
          data.productionTechnologyTransferDocumentFileUrl,
        technologyTransferDocumentQCFileUrl:
          data.technologyTransferDocumentQCFileUrl,
        // اگر می‌خواهید آخرین ویرایش‌کننده ثبت شود:
        // userId: user.sub,
      },
      include: {
        user: {
          select: { id: true, name: true, mobile: true, role: true },
        },
      },
    });
  }

  /**
   * حذف رکورد ScaleUpFinal یک پروژه
   */
  async removeByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step7ScaleUpFinal.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return this.prisma.step7ScaleUpFinal.delete({
      where: { id: existing.id },
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
