import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StabilityStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateContractSpecificationDto,
  UpdateContractSpecificationDto,
} from './dto/create-contract-specification.dto';

@Injectable()
export class ContractSpecificationService {
  constructor(private readonly prisma: PrismaService) {}

  private getUserId(user: TokenPayload): number {
    const userId = (user as any).id ?? (user as any).sub ?? (user as any).userId;
    const parsed = Number(userId);
    if (!Number.isInteger(parsed) || parsed < 1) {
      throw new BadRequestException('کاربر معتبر نیست');
    }
    return parsed;
  }

  // ساختار Include بهینه و هماهنگ با اسکیما جدید
  private readonly contractSpecificationInclude = {
    user: {
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    },
    project: {
      select: {
        id: true,
        projectCode: true,
        title: true,
        apiName: true,
        developerName: true,
        developerPhone: true,
        step: true,
        currentStep: true,
        status: true,
        userId: true,
      },
    },
    impurities: {
      orderBy: { id: 'asc' as const },
    },
  };

  /**
   * ایجاد مشخصات نهایی (Contract Specification) برای پروژه قراردادی
   */
  async create(data: CreateContractSpecificationDto, user: TokenPayload) {
    const currentUserId = this.getUserId(user);

    if (!data.projectId) {
      throw new BadRequestException('شناسه پروژه قراردادی الزامی است');
    }

    const ownerId =
      user.role === Role.ADMIN && data.userId ? Number(data.userId) : currentUserId;

    if (data.userId && user.role !== Role.ADMIN && Number(data.userId) !== currentUserId) {
      throw new BadRequestException('اجازه ثبت برای کاربر دیگر را ندارید');
    }

    if (data.userId) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new NotFoundException('کاربر مورد نظر یافت نشد');
      }
    }

    // بررسی دسترسی کاربر به پروژه قراردادی
    const projectWhere =
      user.role === Role.ADMIN
        ? { id: data.projectId }
        : { id: data.projectId, userId: currentUserId };

    const project = await this.prisma.contractProject.findFirst({
      where: projectWhere,
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException(
        'پروژه قراردادی مورد نظر یافت نشد یا دسترسی ندارید',
      );
    }

    const stage = data.stage ?? StabilityStage.FINISHED_PRODUCT;

    // بررسی یکتایی ترکیب projectId و stage طبق @@unique([projectId, stage])
    const existingSpec = await this.prisma.contractSpecification.findUnique({
      where: {
        projectId_stage: {
          projectId: data.projectId,
          stage,
        },
      },
    });

    if (existingSpec) {
      throw new ConflictException(
        `برای این پروژه قراردادی قبلاً مشخصات مرحله ${stage} ثبت شده است`,
      );
    }

    const { impurities, projectId, userId: _, stage: _stage, ...specFields } = data;

    return this.prisma.contractSpecification.create({
      data: {
        ...specFields,
        stage,
        userId: ownerId,
        projectId: data.projectId,
        impurities: impurities?.length
          ? {
              create: impurities.map((item) => ({
                name: item.name.trim(),
                limit: item.limit !== undefined ? item.limit : (item.value ?? null),
                description: item.description ?? null,
              })),
            }
          : undefined,
      },
      include: this.contractSpecificationInclude,
    });
  }

  /**
   * دریافت لیست تمام Specificationها بر اساس نقش کاربر
   */
  async findAll(user: TokenPayload) {
    const currentUserId = this.getUserId(user);
    const where =
      user.role === Role.ADMIN
        ? {}
        : {
            OR: [
              { userId: currentUserId },
              { project: { userId: currentUserId } },
            ],
          };

    return this.prisma.contractSpecification.findMany({
      where,
      include: this.contractSpecificationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * دریافت یک Specification با شناسه
   */
  async findOne(id: number, user: TokenPayload) {
    const currentUserId = this.getUserId(user);
    const where =
      user.role === Role.ADMIN
        ? { id }
        : {
            id,
            OR: [
              { userId: currentUserId },
              { project: { userId: currentUserId } },
            ],
          };

    const specification = await this.prisma.contractSpecification.findFirst({
      where,
      include: this.contractSpecificationInclude,
    });

    if (!specification) {
      throw new NotFoundException('مشخصات مورد نظر یافت نشد یا دسترسی ندارید');
    }

    return specification;
  }

  /**
   * دریافت Specification اختصاصی یک پروژه قراردادی
   */
  async findByProjectId(projectId: number, user: TokenPayload, stage?: StabilityStage) {
    const currentUserId = this.getUserId(user);
    const projectWhere =
      user.role === Role.ADMIN
        ? { id: projectId }
        : { id: projectId, userId: currentUserId };

    const project = await this.prisma.contractProject.findFirst({
      where: projectWhere,
      select: { id: true },
    });

    if (!project) {
      throw new NotFoundException('پروژه مورد نظر یافت نشد یا دسترسی ندارید');
    }

    return this.prisma.contractSpecification.findFirst({
      where: {
        projectId,
        ...(stage ? { stage } : {}),
      },
      include: this.contractSpecificationInclude,
    });
  }

  /**
   * ویرایش Specification با مدیریت ایمن ناخالصی‌ها بدون شکستن رفرنس‌های نتایج
   */
  async update(
    id: number,
    data: UpdateContractSpecificationDto,
    user: TokenPayload,
  ) {
    const currentUserId = this.getUserId(user);
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.OR = [
        { userId: currentUserId },
        { project: { userId: currentUserId } },
      ];
    }

    const existing = await this.prisma.contractSpecification.findFirst({
      where: whereCondition,
      include: {
        impurities: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('مشخصات مورد نظر یافت نشد یا دسترسی ندارید');
    }

    let ownerId = existing.userId;
    let projectId = existing.projectId;
    const stage = data.stage ?? existing.stage;

    if (typeof data.userId !== 'undefined' && Number(data.userId) !== existing.userId) {
      if (user.role !== Role.ADMIN) {
        throw new BadRequestException('اجازه تغییر مالک مشخصات را ندارید');
      }

      const targetUser = await this.prisma.user.findUnique({
        where: { id: Number(data.userId) },
        select: { id: true },
      });

      if (!targetUser) {
        throw new NotFoundException('کاربر مورد نظر یافت نشد');
      }

      ownerId = Number(data.userId);
    }

    if (
      (typeof data.projectId !== 'undefined' && data.projectId !== existing.projectId) ||
      (typeof data.stage !== 'undefined' && data.stage !== existing.stage)
    ) {
      const targetProjectId = data.projectId ?? existing.projectId;

      const projectWhere =
        user.role === Role.ADMIN
          ? { id: targetProjectId }
          : { id: targetProjectId, userId: currentUserId };

      const targetProject = await this.prisma.contractProject.findFirst({
        where: projectWhere,
        select: { id: true },
      });

      if (!targetProject) {
        throw new NotFoundException(
          'پروژه قراردادی مقصد یافت نشد یا دسترسی ندارید',
        );
      }

      const duplicateSpec = await this.prisma.contractSpecification.findFirst({
        where: {
          projectId: targetProjectId,
          stage,
          NOT: { id },
        },
      });

      if (duplicateSpec) {
        throw new ConflictException(
          'برای این پروژه و مرحله قبلاً مشخصات ثبت شده است',
        );
      }

      projectId = targetProjectId;
    }

    const { impurities, projectId: _p, userId: _u, stage: _s, ...specFields } = data;

    return this.prisma.$transaction(async (tx) => {
      await tx.contractSpecification.update({
        where: { id },
        data: {
          ...specFields,
          stage,
          userId: ownerId,
          projectId,
        },
      });

      // به‌روزرسانی ایمن لیست ناخالصی‌ها (Upsert به جای Delete فله‌ای)
      if (typeof impurities !== 'undefined') {
        const payloadIds = impurities
          .map((item) => item.id)
          .filter((itemId): itemId is number => Boolean(itemId));

        // شناسایی آیتم‌هایی که از لیست حذف شده‌اند
        const toDelete = existing.impurities.filter(
          (imp) => !payloadIds.includes(imp.id),
        );

        for (const item of toDelete) {
          // بررسی اینکه آیا این ناخالصی در تست‌های پایداری نتیجه ثبت‌شده دارد یا خیر
          const resultsCount = await tx.contractResultImpurity.count({
            where: { specImpurityId: item.id },
          });

          if (resultsCount > 0) {
            throw new BadRequestException(
              `ناخالصی "${item.name}" دارای ${resultsCount} نتیجه آزمایش پایداری است و نمی‌توان آن را حذف کرد.`,
            );
          }

          await tx.contractSpecImpurity.delete({
            where: { id: item.id },
          });
        }

        // ایجاد یا ویرایش ناخالصی‌ها
        for (const item of impurities) {
          const limitValue =
            item.limit !== undefined ? item.limit : (item.value ?? null);

          if (item.id) {
            await tx.contractSpecImpurity.update({
              where: { id: item.id },
              data: {
                name: item.name.trim(),
                limit: limitValue,
                description: item.description ?? null,
              },
            });
          } else {
            await tx.contractSpecImpurity.create({
              data: {
                specificationId: id,
                name: item.name.trim(),
                limit: limitValue,
                description: item.description ?? null,
              },
            });
          }
        }
      }

      return tx.contractSpecification.findUnique({
        where: { id },
        include: this.contractSpecificationInclude,
      });
    });
  }

  /**
   * حذف Specification
   */
  async remove(id: number, user: TokenPayload) {
    const currentUserId = this.getUserId(user);
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.OR = [
        { userId: currentUserId },
        { project: { userId: currentUserId } },
      ];
    }

    const existing = await this.prisma.contractSpecification.findFirst({
      where: whereCondition,
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException('مشخصات مورد نظر یافت نشد یا دسترسی ندارید');
    }

    return this.prisma.contractSpecification.delete({
      where: { id },
    });
  }
}
