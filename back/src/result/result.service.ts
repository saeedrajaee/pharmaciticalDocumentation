import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import { CreateResultDto } from './dto/create-result.dto';
import { UpdateResultDto } from './dto/update-result.dto';

@Injectable()
export class ResultService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly resultInclude = {
    user: {
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    },
    batch: {
      include: {
        drugProduct: {
          select: {
            id: true,
            finishedProductName: true,
            api: true,
            dosageForm: true,
            strength: true,
            strengthUnit: true,
            strongCondition: true,
            specification: {
              include: {
                impurities: true,
              },
            },
          },
        },
      },
    },
    impurities: true,
  };

  async create(data: CreateResultDto, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    if (!data.batchId) {
      throw new BadRequestException('شناسه بچ الزامی است');
    }

    const ownerId =
      user.role === Role.ADMIN && data.userId ? data.userId : user.sub;

    if (data.userId && user.role !== Role.ADMIN && data.userId !== user.sub) {
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

    const batchWhere =
      user.role === Role.ADMIN
        ? { id: data.batchId }
        : { id: data.batchId, userId: user.sub };

    const batch = await this.prisma.batch.findFirst({
      where: batchWhere,
      select: {
        id: true,
        userId: true,
        drugProductId: true,
      },
    });

    if (!batch) {
      throw new NotFoundException('بچ مورد نظر یافت نشد یا دسترسی ندارید');
    }

    return this.prisma.result.create({
      data: {
        accelrator: data.accelrator,
        month: data.month,
        appearance: data.appearance ?? true,
        identification1: data.identification1 ?? true,
        identification2: data.identification2 ?? true,
        assay: data.assay,
        pH: data.pH,
        clarity: data.clarity ?? true,
        particulatedMater25: data.particulatedMater25,
        particulatedMater10: data.particulatedMater10,
        leakTest: data.leakTest ?? true,
        sterility: data.sterility ?? true,
        endotoxin: data.endotoxin,
        osmolarity: data.osmolarity,
        uniformityOfDosage: data.uniformityOfDosage,
        user: { connect: { id: ownerId } },
        batch: { connect: { id: data.batchId } },
        ...(data.impurities?.length
          ? {
              impurities: {
                create: data.impurities.map((item) => ({
                  name: item.name,
                  value: item.value,
                  description: item.description,
                })),
              },
            }
          : {}),
      },
      include: this.resultInclude,
    });
  }

  async findAll(user: TokenPayload) {
    const where = user.role === Role.ADMIN ? {} : { userId: user.sub };

    return this.prisma.result.findMany({
      where,
      include: this.resultInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, user: TokenPayload) {
    const where = user.role === Role.ADMIN ? { id } : { id, userId: user.sub };

    const result = await this.prisma.result.findFirst({
      where,
      include: this.resultInclude,
    });

    if (!result) {
      throw new NotFoundException('نتیجه مورد نظر یافت نشد');
    }

    return result;
  }

  async update(id: number, data: UpdateResultDto, user: TokenPayload) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.result.findFirst({
      where: whereCondition,
      include: {
        impurities: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('نتیجه مورد نظر یافت نشد یا دسترسی ندارید');
    }

    let ownerId = existing.userId;
    let batchId = existing.batchId;

    if (typeof data.userId !== 'undefined' && data.userId !== existing.userId) {
      if (user.role !== Role.ADMIN) {
        throw new BadRequestException('اجازه تغییر مالک نتیجه را ندارید');
      }

      const targetUser = await this.prisma.user.findUnique({
        where: { id: data.userId },
        select: { id: true },
      });

      if (!targetUser) {
        throw new NotFoundException('کاربر مورد نظر یافت نشد');
      }

      ownerId = data.userId;
    }

    if (typeof data.batchId !== 'undefined' && data.batchId !== existing.batchId) {
      const batchWhere =
        user.role === Role.ADMIN
          ? { id: data.batchId }
          : { id: data.batchId, userId: user.sub };

      const batch = await this.prisma.batch.findFirst({
        where: batchWhere,
        select: { id: true },
      });

      if (!batch) {
        throw new NotFoundException('بچ مورد نظر یافت نشد یا دسترسی ندارید');
      }

      batchId = data.batchId;
    }

    await this.prisma.result.update({
      where: { id },
      data: {
        accelrator: data.accelrator ?? existing.accelrator,
        month: data.month ?? existing.month,
        appearance: data.appearance ?? existing.appearance,
        identification1: data.identification1 ?? existing.identification1,
        identification2: data.identification2 ?? existing.identification2,
        assay: data.assay ?? existing.assay,
        pH: data.pH ?? existing.pH,
        clarity: data.clarity ?? existing.clarity,
        particulatedMater25:
          data.particulatedMater25 ?? existing.particulatedMater25,
        particulatedMater10:
          data.particulatedMater10 ?? existing.particulatedMater10,
        leakTest: data.leakTest ?? existing.leakTest,
        sterility: data.sterility ?? existing.sterility,
        endotoxin: data.endotoxin ?? existing.endotoxin,
        osmolarity: data.osmolarity ?? existing.osmolarity,
        uniformityOfDosage:
          data.uniformityOfDosage ?? existing.uniformityOfDosage,
        userId: ownerId ?? null,
        batchId,
      },
    });

    if (typeof data.impurities !== 'undefined') {
      // تغییر مهم در این دو خط:
      await this.prisma.specificationImpurity.deleteMany({
        where: { resultId: id },
      });

      if (data.impurities.length) {
        await this.prisma.specificationImpurity.createMany({
          data: data.impurities.map((item) => ({
            resultId: id,
            name: item.name,
            value: item.value,
            description: item.description,
          })),
        });
      }
    }

    return this.prisma.result.findUnique({
      where: { id },
      include: this.resultInclude,
    });
  }


  async remove(id: number, user: TokenPayload) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.result.findFirst({
      where: whereCondition,
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('نتیجه مورد نظر یافت نشد یا دسترسی ندارید');
    }

    return this.prisma.result.delete({
      where: { id },
    });
  }
}
