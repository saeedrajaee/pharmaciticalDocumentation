import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TokenPayload } from 'src/auth/token-payload.interface';
import { CreateBatchDto } from './dto/create-batch.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { promises as fsp } from 'fs';
import { existsSync } from 'fs';
import { isAbsolute, join, normalize, sep } from 'path';

@Injectable()
export class BatchService {
  constructor(private readonly prisma: PrismaService) {}

  private resolveUploadPath(p?: string | null) {
    if (!p) return null;

    const normalized = normalize(p);
    return isAbsolute(normalized)
      ? normalized
      : join(process.cwd(), normalized);
  }

  private async safeUnlink(p?: string | null) {
    const abs = this.resolveUploadPath(p);
    if (!abs) return;

    const uploadsRoot = join(process.cwd(), 'uploads');
    const normalizedUploadsRoot = `${normalize(uploadsRoot)}${sep}`;
    const normalizedAbs = normalize(abs);

    if (
      normalizedAbs !== normalize(uploadsRoot) &&
      !normalizedAbs.startsWith(normalizedUploadsRoot)
    ) {
      return;
    }

    try {
      if (existsSync(normalizedAbs)) {
        await fsp.unlink(normalizedAbs);
      }
    } catch (error) {
      console.error(`Error deleting file ${normalizedAbs}:`, error);
    }
  }

  async create(data: CreateBatchDto, filePaths: any, user: TokenPayload) {
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
      select: { id: true, userId: true },
    });

    if (!drugProduct) {
      throw new NotFoundException('محصول دارویی یافت نشد یا دسترسی ندارید');
    }

    return this.prisma.batch.create({
      data: {
        batchDate: new Date(data.batchDate),
        batchNumber: data.batchNumber ?? null,
        description: data.description ?? null,
        uploadDoc: filePaths?.uploadDoc ?? data.uploadDoc ?? null,
        user: { connect: { id: ownerId } },
        drugProduct: { connect: { id: data.drugProductId } },
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
        results: {
          include: {
            impurities: true,
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

    return this.prisma.batch.findMany({
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
    });
  }

  async findOne(id: number, user: TokenPayload) {
    const where = user.role === Role.ADMIN ? { id } : { id, userId: user.sub };

    const batch = await this.prisma.batch.findFirst({
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
        results: {
          include: {
            impurities: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!batch) {
      throw new NotFoundException('بچ یافت نشد');
    }

    return batch;
  }

  async update(
    id: number,
    data: UpdateBatchDto,
    filePaths: any,
    user: TokenPayload,
  ) {
    const whereCondition: any = { id };

    if (user.role !== Role.ADMIN) {
      whereCondition.userId = user.sub;
    }

    const existing = await this.prisma.batch.findFirst({
      where: whereCondition,
    });

    if (!existing) {
      throw new NotFoundException('بچ یافت نشد یا دسترسی ندارید');
    }

    let ownerId = existing.userId;
    let drugProductId = existing.drugProductId;

    // تغییر اصلی در این قسمت اعمال شده است
    if (
      typeof data.userId !== 'undefined' &&
      data.userId !== existing.userId
    ) {
      if (user.role !== Role.ADMIN) {
        throw new BadRequestException('اجازه تغییر مالک بچ را ندارید');
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

    if (typeof data.drugProductId !== 'undefined') {
      const drugProductWhere =
        user.role === Role.ADMIN
          ? { id: data.drugProductId }
          : { id: data.drugProductId, userId: user.sub };

      const drugProduct = await this.prisma.drugProduct.findFirst({
        where: drugProductWhere,
        select: { id: true },
      });

      if (!drugProduct) {
        throw new NotFoundException(
          'محصول دارویی مورد نظر یافت نشد یا دسترسی ندارید',
        );
      }

      drugProductId = data.drugProductId;
    }

    if (filePaths?.uploadDoc) {
      await this.safeUnlink(existing.uploadDoc);
    }

    return this.prisma.batch.update({
      where: { id },
      data: {
        batchDate: data.batchDate
          ? new Date(data.batchDate)
          : existing.batchDate,
          batchNumber: data.batchNumber ?? existing.batchNumber,
        description: data.description ?? existing.description,
        uploadDoc: filePaths?.uploadDoc ?? data.uploadDoc ?? existing.uploadDoc,
        userId: ownerId ?? null,
        drugProductId,
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
        results: {
          include: {
            impurities: true,
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

    const existing = await this.prisma.batch.findFirst({
      where: whereCondition,
      include: {
        results: {
          include: {
            impurities: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('بچ یافت نشد یا دسترسی ندارید');
    }

    await this.safeUnlink(existing.uploadDoc);

    return this.prisma.batch.delete({
      where: { id },
    });
  }
}
