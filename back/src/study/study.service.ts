import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateStep1LiteratureStudyDto,
  UpdateStep1LiteratureStudyDto,
} from './dto/create-study.dto';

@Injectable()
export class StudyService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * افزودن یک مطالعه جدید به پروژه
   */
  async create(
    projectId: number,
    data: CreateStep1LiteratureStudyDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی کاربر به پروژه (ادمین به همه پروژه‌ها دسترسی دارد، کاربر عادی فقط به پروژه خودش)
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. جدا کردن فیلدهای اضافی احتمالی از DTO
    const { ...studyData } = data;

    // ۳. ثبت داده در پایگاه داده
    return this.prisma.step1LiteratureStudy.create({
      data: {
        ...studyData,
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
   * دریافت لیست تمام مطالعات یک پروژه
   */
  async findAllByProject(projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.step1LiteratureStudy.findMany({
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
   * دریافت یک مطالعه خاص
   */
  async findOne(studyId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    const study = await this.prisma.step1LiteratureStudy.findFirst({
      where: {
        id: studyId,
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

    if (!study) {
      throw new NotFoundException('مطالعه مورد نظر یافت نشد');
    }

    return study;
  }

  /**
   * ویرایش یک مطالعه خاص
   */
  async update(
    studyId: number,
    projectId: number,
    data: UpdateStep1LiteratureStudyDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد مطالعه در این پروژه
    const existing = await this.prisma.step1LiteratureStudy.findFirst({
      where: {
        id: studyId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException('مطالعه مورد نظر در این پروژه یافت نشد');
    }

    // ۳. به‌روزرسانی اطلاعات مطالعه
    return this.prisma.step1LiteratureStudy.update({
      where: { id: studyId },
      data,
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
   * حذف یک مطالعه
   */
  async remove(studyId: number, projectId: number, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    // ۱. بررسی دسترسی به پروژه
    await this.ensureUserHasAccessToProject(projectId, user);

    // ۲. بررسی وجود رکورد برای حذف امن‌تر
    const existing = await this.prisma.step1LiteratureStudy.findFirst({
      where: {
        id: studyId,
        projectId,
      },
    });

    if (!existing) {
      throw new NotFoundException('مطالعه مورد نظر یافت نشد');
    }

    // ۳. حذف رکورد
    return this.prisma.step1LiteratureStudy.delete({
      where: { id: studyId },
    });
  }

  /**
   * متد کمکی مشترک برای بررسی اینکه آیا کاربر به پروژه مورد نظر دسترسی دارد یا خیر
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
