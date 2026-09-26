import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import { CreateDrugProductDto } from './dto/create-drug-product.dto';
import { UpdateDrugProductDto } from './dto/update-drug-product.dto';

@Injectable()
export class DrugProductService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateDrugProductDto, user: TokenPayload) {
    if (!user?.sub) {
      throw new BadRequestException('کاربر معتبر نیست');
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

    return this.prisma.drugProduct.create({
      data: {
        finishedProductName: data.finishedProductName,
        api: data.api,
        dosageForm: data.dosageForm,
        strength: data.strength,
        strengthUnit: data.strengthUnit,
        strongCondition: data.strongCondition,
        user: { connect: { id: ownerId } },
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
        specification: {
          include: {
            impurities: true,
          },
        },
        batches: {
          include: {
            results: {
              include: {
                impurities: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async findAll(user: TokenPayload) {
    const where = user.role === Role.ADMIN ? {} : { userId: user.sub };

    return this.prisma.drugProduct.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
        specification: {
          include: {
            impurities: true,
          },
        },
        batches: {
          include: {
            results: {
              include: {
                impurities: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number, user: TokenPayload) {
    const where = user.role === Role.ADMIN ? { id } : { id, userId: user.sub };

    const drugProduct = await this.prisma.drugProduct.findFirst({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            mobile: true,
            role: true,
          },
        },
        specification: {
          include: {
            impurities: true,
          },
        },
        batches: {
          include: {
            results: {
              include: {
                impurities: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!drugProduct) {
      throw new NotFoundException('محصول دارویی یافت نشد');
    }

    return drugProduct;
  }

  async update(
    id: number,
    data: UpdateDrugProductDto,
    user: TokenPayload,
  ) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.drugProduct.findFirst({
      where: whereCondition,
    });

    if (!existing) {
      throw new NotFoundException('محصول دارویی یافت نشد یا دسترسی ندارید');
    }

    let ownerId = existing.userId;

    if (typeof data.userId !== 'undefined') {
      if (user.role !== Role.ADMIN) {
        throw new BadRequestException('اجازه تغییر مالک پرونده را ندارید');
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

    return this.prisma.drugProduct.update({
      where: { id },
      data: {
        finishedProductName:
          data.finishedProductName ?? existing.finishedProductName,
        api: data.api ?? existing.api,
        dosageForm: data.dosageForm ?? existing.dosageForm,
        strength: data.strength ?? existing.strength,
        strengthUnit: data.strengthUnit ?? existing.strengthUnit,
        strongCondition: data.strongCondition ?? existing.strongCondition,
        userId: ownerId ?? null,
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
        specification: {
          include: {
            impurities: true,
          },
        },
        batches: {
          include: {
            results: {
              include: {
                impurities: true,
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });
  }

  async remove(id: number, user: TokenPayload) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.drugProduct.findFirst({
      where: whereCondition,
      include: {
        specification: {
          include: {
            impurities: true,
          },
        },
        batches: {
          include: {
            results: {
              include: {
                impurities: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('محصول دارویی یافت نشد یا دسترسی ندارید');
    }

    return this.prisma.drugProduct.delete({
      where: { id },
    });
  }
}
