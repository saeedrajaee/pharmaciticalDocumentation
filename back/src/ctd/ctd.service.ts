import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import type { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep8CtdModuleDto,
  UpdateStep8CtdModuleDto,
} from './dto/create-ctd.dto';

@Injectable()
export class CtdService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ایجاد رکورد CTD برای یک پروژه (هر پروژه فقط یک رکورد دارد)
   */
  async create(projectId: number, data: CreateStep8CtdModuleDto, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    // اگر قرار است هر پروژه فقط یک رکورد داشته باشد:
    const existing = await this.prisma.step8CtdModule.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('برای این پروژه قبلاً اطلاعات CTD ثبت شده است');
    }

    return this.prisma.step8CtdModule.create({
      data: {
        ctdFileUrl: data.ctdFileUrl,
        fdaApproval: data.fdaApproval, // اگر ارسال نشود، default در DB اعمال می‌شود
        fdaApprovalLetterNumber: data.fdaApprovalLetterNumber,
        fdaApprovalLetterFileUrl: data.fdaApprovalLetterFileUrl,
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
   * دریافت رکورد CTD یک پروژه
   */
  async findOneByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const ctd = await this.prisma.step8CtdModule.findFirst({
      where: { projectId },
      include: {
        user: {
          select: { id: true, name: true, mobile: true, role: true },
        },
      },
    });

    if (!ctd) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return ctd;
  }

  /**
   * ویرایش رکورد CTD یک پروژه
   * نکته: چون projectId در اسکیما unique نیست، ابتدا رکورد را پیدا می‌کنیم و با id آپدیت می‌کنیم.
   */
  async updateByProject(
    projectId: number,
    data: UpdateStep8CtdModuleDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step8CtdModule.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return this.prisma.step8CtdModule.update({
      where: { id: existing.id },
      data: {
        ctdFileUrl: data.ctdFileUrl,
        fdaApproval: data.fdaApproval,
        fdaApprovalLetterNumber: data.fdaApprovalLetterNumber,
        fdaApprovalLetterFileUrl: data.fdaApprovalLetterFileUrl,
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
   * حذف رکورد CTD یک پروژه
   */
  async removeByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const existing = await this.prisma.step8CtdModule.findFirst({
      where: { projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('رکوردی برای این پروژه ثبت نشده است');
    }

    return this.prisma.step8CtdModule.delete({
      where: { id: existing.id },
    });
  }

  /**
   * متد کمکی برای بررسی دسترسی کاربر به پروژه
   */
  private async ensureUserHasAccessToProject(projectId: number, user: TokenPayload) {
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
