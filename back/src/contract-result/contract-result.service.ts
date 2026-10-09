import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateContractResultDto,
  UpdateContractResultDto,
  ContractResultImpurityInputDto,
} from './dto/create-contract-result.dto';
import type { TokenPayload } from 'src/auth/token-payload.interface';

@Injectable()
export class ContractResultService {
  constructor(private readonly prisma: PrismaService) {}

  // دریافت شناسه کاربر چه به صورت id و چه به صورت sub (استاندارد JWT)
  private getUserId(user: TokenPayload): number {
    const userId = (user as any).id ?? (user as any).sub ?? (user as any).userId;

    const parsedUserId = Number(userId);

    if (!Number.isInteger(parsedUserId) || parsedUserId < 1) {
      throw new BadRequestException('شناسه کاربر معتبر نیست');
    }

    return parsedUserId;
  }

  /**
   * ✅ include درست بر اساس Prisma schema شما:
   * ContractResult -> contractResultImpurities
   */
  private readonly contractResultInclude = {
    user: {
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    },
    batch: true,
    contractResultImpurities: {
      include: {
        specImpurity: true,
      },
    },
  };

  /**
   * اعتبارسنجی شناسه‌های ناخالصی و بررسی تعلق آن‌ها به اسپک همین پروژه
   */
  private async validateImpurities(
    impurities: ContractResultImpurityInputDto[] | undefined,
    specificationId: number | null,
  ): Promise<Array<{ specImpurityId: number; value: number }>> {
    if (!impurities || impurities.length === 0) {
      return [];
    }

    if (!specificationId) {
      throw new BadRequestException(
        'برای ثبت نتایج ناخالصی، اسپک مشخصات پروژه یافت نشد',
      );
    }

    const normalized = impurities.map((item) => {
      const specImpurityId = Number((item as any).specImpurityId ?? (item as any).id);
      const value = Number((item as any).value);

      if (!Number.isInteger(specImpurityId) || specImpurityId < 1) {
        throw new BadRequestException(
          'برای هر نتیجه ناخالصی، specImpurityId معتبر ارسال کنید',
        );
      }

      if (!Number.isFinite(value)) {
        throw new BadRequestException(
          `مقدار ناخالصی با شناسه ${specImpurityId} معتبر نیست`,
        );
      }

      return { specImpurityId, value };
    });

    const ids = normalized.map((item) => item.specImpurityId);

    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException(
        'یک ناخالصی بیش از یک‌بار در نتایج ارسال شده است',
      );
    }

    const matchingSpecImpurities = await this.prisma.contractSpecImpurity.findMany({
      where: {
        id: { in: ids },
        specificationId,
      },
      select: { id: true },
    });

    if (matchingSpecImpurities.length !== ids.length) {
      throw new BadRequestException(
        'یک یا چند ناخالصی به اسپک مشخصات این پروژه تعلق ندارند یا یافت نشدند',
      );
    }

    return normalized;
  }

  /**
   * ثبت نتیجه جدید
   */
  async create(data: CreateContractResultDto, user: TokenPayload) {
    const { impurities, ...resultFields } = data;
    const currentUserId = this.getUserId(user);

    const batch = await this.prisma.contractBatch.findUnique({
      where: { id: resultFields.batchId },
      select: { id: true, projectId: true },
    });

    if (!batch) {
      throw new NotFoundException(`بچ با شناسه ${resultFields.batchId} یافت نشد`);
    }

    const existingResult = await this.prisma.contractResult.findUnique({
      where: {
        batchId_month: {
          batchId: resultFields.batchId,
          month: resultFields.month,
        },
      },
    });

    if (existingResult) {
      throw new ConflictException(
        `نتیجه مربوط به ماه ${resultFields.month} برای این سری ساخت قبلاً ثبت شده است`,
      );
    }

    let specificationId: number | null = null;

    if (batch.projectId) {
      const specification = await this.prisma.contractSpecification.findFirst({
        where: { projectId: batch.projectId },
        select: { id: true },
      });

      specificationId = specification?.id ?? null;
    }

    const normalizedImpurities = await this.validateImpurities(
      impurities,
      specificationId,
    );

    return this.prisma.$transaction(async (tx) => {
      const createdResult = await tx.contractResult.create({
        data: {
          ...resultFields,
          userId: currentUserId,
        },
      });

      for (const item of normalizedImpurities) {
        await tx.contractResultImpurity.create({
          data: {
            resultId: createdResult.id,
            specImpurityId: item.specImpurityId,
            value: item.value,
          },
        });
      }

      return tx.contractResult.findUnique({
        where: { id: createdResult.id },
        include: this.contractResultInclude,
      });
    });
  }

  /**
   * دریافت همه نتایج با فیلتر اختیاری batchId
   */
  async findAll(batchId?: number) {
    return this.prisma.contractResult.findMany({
      where: batchId ? { batchId } : undefined,
      include: this.contractResultInclude,
      orderBy: { month: 'asc' },
    });
  }

  /**
   * دریافت یک نتیجه بر اساس شناسه
   */
  async findOne(id: number) {
    const result = await this.prisma.contractResult.findUnique({
      where: { id },
      include: this.contractResultInclude,
    });

    if (!result) {
      throw new NotFoundException(`نتیجه آزمایش با شناسه ${id} یافت نشد`);
    }

    return result;
  }

  /**
   * به‌روزرسانی نتیجه
   */
  async update(id: number, data: UpdateContractResultDto, user: TokenPayload) {
    const existing = await this.prisma.contractResult.findUnique({
      where: { id },
      include: {
        batch: {
          select: { id: true, projectId: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`نتیجه آزمایش با شناسه ${id} یافت نشد`);
    }

    const { impurities, ...resultFields } = data;
    const currentUserId = this.getUserId(user);

    const effectiveBatchId = resultFields.batchId ?? existing.batch.id;

    const effectiveBatch =
      effectiveBatchId === existing.batch.id
        ? existing.batch
        : await this.prisma.contractBatch.findUnique({
            where: { id: effectiveBatchId },
            select: { id: true, projectId: true },
          });

    if (!effectiveBatch) {
      throw new NotFoundException(`بچ با شناسه ${effectiveBatchId} یافت نشد`);
    }

    let specificationId: number | null = null;

    if (effectiveBatch.projectId) {
      const specification = await this.prisma.contractSpecification.findFirst({
        where: { projectId: effectiveBatch.projectId },
        select: { id: true },
      });

      specificationId = specification?.id ?? null;
    }

    const normalizedImpurities =
      impurities === undefined
        ? undefined
        : await this.validateImpurities(impurities, specificationId);

    return this.prisma.$transaction(async (tx) => {
      await tx.contractResult.update({
        where: { id },
        data: {
          ...resultFields,
          userId: currentUserId,
        },
      });

      if (normalizedImpurities !== undefined) {
        await tx.contractResultImpurity.deleteMany({
          where: { resultId: id },
        });

        for (const item of normalizedImpurities) {
          await tx.contractResultImpurity.create({
            data: {
              resultId: id,
              specImpurityId: item.specImpurityId,
              value: item.value,
            },
          });
        }
      }

      return tx.contractResult.findUnique({
        where: { id },
        include: this.contractResultInclude,
      });
    });
  }

  /**
   * حذف نتیجه
   */
  async remove(id: number, _user: TokenPayload) {
    const result = await this.prisma.contractResult.findUnique({
      where: { id },
    });

    if (!result) {
      throw new NotFoundException(`نتیجه آزمایش با شناسه ${id} یافت نشد`);
    }

    return this.prisma.contractResult.delete({
      where: { id },
      include: this.contractResultInclude,
    });
  }
}
