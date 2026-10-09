import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, StabilityStage } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import {
  CreateContractBatchDto,
  UpdateContractBatchDto,
} from './dto/create-contract-batch.dto';

@Injectable()
export class ContractBatchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Include مشترک برای واکشی بچ به همراه پروژه، اسپک‌ها، ناخالصی‌ها و نتایج پایداری
   */
  private readonly batchInclude = {
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
        status: true,
        step: true,
        userId: true,

        // ✅ واکشی اسپک‌های پروژه به همراه ناخالصی‌های هر اسپک
        specifications: {
          include: {
            impurities: true,
          },
        },
      },
    },

    // ✅ واکشی نتایج پایداری + ناخالصی‌های ثبت شده برای هر نتیجه
    results: {
      include: {
        contractResultImpurities: {
          include: {
            specImpurity: true,
          },
        },
      },
    },
  };

  /**
   * ایجاد بچ مطالعات پایداری برای یک پروژه قراردادی
   * (برای هر پروژه چند بچ مجاز است؛ یکتایی روی [projectId, stage, batchNumber])
   */
  async create(
    projectId: number,
    data: CreateContractBatchDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    const stage = data.stage ?? StabilityStage.FINISHED_PRODUCT;
    const batchNumber = data.batchNumber.trim();

    const existing = await this.prisma.contractBatch.findUnique({
      where: {
        projectId_stage_batchNumber: {
          projectId,
          stage,
          batchNumber,
        },
      },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(
        'بچی با این شماره در این مرحله پایداری برای این پروژه قبلاً ثبت شده است',
      );
    }

    return this.prisma.contractBatch.create({
      data: {
        projectId,
        stage,
        batchNumber,
        batchDate: new Date(data.batchDate),
        description: data.description,
        uploadDoc: data.uploadDoc,
        userId: user.sub,
      },
      include: this.batchInclude,
    });
  }

  /**
   * دریافت لیست بچ‌های پایداری یک پروژه (با فیلتر اختیاری مرحله پایداری)
   */
  async findAllByProject(
    projectId: number,
    user: TokenPayload,
    stage?: StabilityStage,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    await this.ensureUserHasAccessToProject(projectId, user);

    return this.prisma.contractBatch.findMany({
      where: {
        projectId,
        ...(stage ? { stage } : {}),
      },
      include: this.batchInclude,
      orderBy: {
        batchDate: 'desc',
      },
    });
  }

  /**
   * دریافت یک بچ با شناسه بچ
   */
  async findOne(id: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    const batch = await this.prisma.contractBatch.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!batch) {
      throw new NotFoundException('بچ مورد نظر یافت نشد');
    }

    await this.ensureUserHasAccessToProject(batch.projectId, user);

    return this.prisma.contractBatch.findUnique({
      where: { id },
      include: this.batchInclude,
    });
  }

  /**
   * ویرایش بچ پایداری
   */
  async update(
    id: number,
    data: UpdateContractBatchDto,
    user: TokenPayload,
  ) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    const existing = await this.prisma.contractBatch.findUnique({
      where: { id },
      select: {
        id: true,
        projectId: true,
        stage: true,
        batchNumber: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('بچ مورد نظر یافت نشد');
    }

    await this.ensureUserHasAccessToProject(existing.projectId, user);

    const targetStage = data.stage ?? existing.stage;
    const targetBatchNumber = data.batchNumber?.trim() ?? existing.batchNumber;

    if (
      targetStage !== existing.stage ||
      targetBatchNumber !== existing.batchNumber
    ) {
      const duplicate = await this.prisma.contractBatch.findFirst({
        where: {
          projectId: existing.projectId,
          stage: targetStage,
          batchNumber: targetBatchNumber,
          NOT: { id },
        },
        select: { id: true },
      });

      if (duplicate) {
        throw new ConflictException(
          'بچ دیگری با این شماره در این مرحله پایداری برای این پروژه وجود دارد',
        );
      }
    }

    return this.prisma.contractBatch.update({
      where: { id },
      data: {
        stage: targetStage,
        batchNumber: targetBatchNumber,
        batchDate: data.batchDate ? new Date(data.batchDate) : undefined,
        description: data.description,
        uploadDoc: data.uploadDoc,
        ...(user.role === Role.ADMIN && typeof data.userId !== 'undefined'
          ? { userId: data.userId }
          : {}),
      },
      include: this.batchInclude,
    });
  }

  /**
   * حذف بچ پایداری
   */
  async remove(id: number, user: TokenPayload) {
    if (!user?.sub) throw new BadRequestException('کاربر معتبر نیست');

    const existing = await this.prisma.contractBatch.findUnique({
      where: { id },
      select: { id: true, projectId: true },
    });

    if (!existing) {
      throw new NotFoundException('بچ مورد نظر یافت نشد');
    }

    await this.ensureUserHasAccessToProject(existing.projectId, user);

    return this.prisma.contractBatch.delete({
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
