import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import { CreateSpecificationDto } from './dto/create-specification.dto';
import { UpdateSpecificationDto } from './dto/update-specification.dto';

@Injectable()
export class SpecificationService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly specificationInclude = {
    user: {
      select: {
        id: true,
        name: true,
        mobile: true,
        role: true,
      },
    },
    drugProduct: {
      select: {
        id: true,
        finishedProductName: true,
        api: true,
        dosageForm: true,
        strength: true,
        strengthUnit: true,
        strongCondition: true,
      },
    },
    impurities: true,
  };

  async create(data: CreateSpecificationDto, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
    }

    if (!data.drugProductId) {
      throw new BadRequestException('شناسه محصول دارویی الزامی است');
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

    const drugProductWhere =
      user.role === Role.ADMIN
        ? { id: data.drugProductId }
        : { id: data.drugProductId, userId: user.sub };

    const drugProduct = await this.prisma.drugProduct.findFirst({
      where: drugProductWhere,
      select: {
        id: true,
        userId: true,
        specification: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!drugProduct) {
      throw new NotFoundException(
        'محصول دارویی مورد نظر یافت نشد یا دسترسی ندارید',
      );
    }

    if (drugProduct.specification) {
      throw new ConflictException(
        'برای این محصول دارویی قبلاً specification ثبت شده است',
      );
    }

    return this.prisma.specification.create({
      data: {
        descriptionAppearance: data.descriptionAppearance,
        identification1: data.identification1,
        identification2: data.identification2,
        assayMin: data.assayMin,
        assayMax: data.assayMax,
        pHMin: data.pHMin,
        pHMax: data.pHMax,
        clarity: data.clarity,
        particulatedMater25: data.particulatedMater25,
        particulatedMater10: data.particulatedMater10,
        sterility: data.sterility,
        leakTest: data.leakTest,
        endotoxin: data.endotoxin,
        osmolarityMin: data.osmolarityMin,
        osmolarityMax: data.osmolarityMax,
        preservativeContent: data.preservativeContent,
        uniformityOfDosage: data.uniformityOfDosage,
        user: { connect: { id: ownerId } },
        drugProduct: { connect: { id: data.drugProductId } },
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
      include: this.specificationInclude,
    });
  }

  async findAll(user: TokenPayload) {
    const where = user.role === Role.ADMIN ? {} : { userId: user.sub };

    return this.prisma.specification.findMany({
      where,
      include: this.specificationInclude,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, user: TokenPayload) {
    const where = user.role === Role.ADMIN ? { id } : { id, userId: user.sub };

    const specification = await this.prisma.specification.findFirst({
      where,
      include: this.specificationInclude,
    });

    if (!specification) {
      throw new NotFoundException('مشخصات مورد نظر یافت نشد');
    }

    return specification;
  }

  async update(id: number, data: UpdateSpecificationDto, user: TokenPayload) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.specification.findFirst({
      where: whereCondition,
      include: {
        impurities: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('مشخصات مورد نظر یافت نشد یا دسترسی ندارید');
    }

    let ownerId = existing.userId;
    let drugProductId = existing.drugProductId;

    if (typeof data.userId !== 'undefined' && data.userId !== existing.userId) {
      if (user.role !== Role.ADMIN) {
        throw new BadRequestException('اجازه تغییر مالک مشخصات را ندارید');
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

    if (
      typeof data.drugProductId !== 'undefined' &&
      data.drugProductId !== existing.drugProductId
    ) {
      const drugProductWhere =
        user.role === Role.ADMIN
          ? { id: data.drugProductId }
          : { id: data.drugProductId, userId: user.sub };

      const drugProduct = await this.prisma.drugProduct.findFirst({
        where: drugProductWhere,
        select: {
          id: true,
          specification: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!drugProduct) {
        throw new NotFoundException(
          'محصول دارویی مورد نظر یافت نشد یا دسترسی ندارید',
        );
      }

      if (drugProduct.specification && drugProduct.specification.id !== id) {
        throw new ConflictException(
          'برای این محصول دارویی قبلاً specification ثبت شده است',
        );
      }

      drugProductId = data.drugProductId;
    }

    await this.prisma.specification.update({
      where: { id },
      data: {
        descriptionAppearance:
          data.descriptionAppearance ?? existing.descriptionAppearance,
        identification1: data.identification1 ?? existing.identification1,
        identification2: data.identification2 ?? existing.identification2,
        assayMin: data.assayMin ?? existing.assayMin,
        assayMax: data.assayMax ?? existing.assayMax,
        pHMin: data.pHMin ?? existing.pHMin,
        pHMax: data.pHMax ?? existing.pHMax,
        clarity: data.clarity ?? existing.clarity,
        particulatedMater25:
          data.particulatedMater25 ?? existing.particulatedMater25,
        particulatedMater10:
          data.particulatedMater10 ?? existing.particulatedMater10,
        sterility: data.sterility ?? existing.sterility,
        leakTest: data.leakTest ?? existing.leakTest,
        endotoxin: data.endotoxin ?? existing.endotoxin,
        osmolarityMin: data.osmolarityMin ?? existing.osmolarityMin,
        osmolarityMax: data.osmolarityMax ?? existing.osmolarityMax,
        preservativeContent:
          data.preservativeContent ?? existing.preservativeContent,
        uniformityOfDosage:
          data.uniformityOfDosage ?? existing.uniformityOfDosage,
        userId: ownerId ?? null,
        drugProductId,
      },
    });

    if (typeof data.impurities !== 'undefined') {
      await this.prisma.specificationImpurity.deleteMany({
        where: { specificationId: id },
      });

      if (data.impurities.length) {
        await this.prisma.specificationImpurity.createMany({
          data: data.impurities.map((item) => ({
            specificationId: id,
            name: item.name,
            value: item.value,
            description: item.description,
          })),
        });
      }
    }

    return this.prisma.specification.findUnique({
      where: { id },
      include: this.specificationInclude,
    });
  }

  async remove(id: number, user: TokenPayload) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.specification.findFirst({
      where: whereCondition,
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('مشخصات مورد نظر یافت نشد یا دسترسی ندارید');
    }

    return this.prisma.specification.delete({
      where: { id },
    });
  }
}
