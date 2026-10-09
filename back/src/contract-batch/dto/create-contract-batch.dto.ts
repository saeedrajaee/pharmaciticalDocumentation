import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { StabilityStage } from '@prisma/client';

export class CreateContractBatchDto {

  @IsOptional()
  @IsEnum(StabilityStage, {
    message: 'مرحله پایداری معتبر نیست (FINISHED_PRODUCT, LAB_SCALE و...)',
  })
  stage?: StabilityStage;

  @IsString()
  @IsNotEmpty({ message: 'شماره بچ الزامی است' })
  batchNumber: string;

  @IsDateString({}, { message: 'فرمت تاریخ ساخت بچ نامعتبر است (ISO 8601)' })
  @IsNotEmpty({ message: 'تاریخ ساخت بچ الزامی است' })
  batchDate: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  uploadDoc?: string;

  @IsOptional()
  @IsInt()
  userId?: number;
}

export class UpdateContractBatchDto extends PartialType(
  CreateContractBatchDto,
) {}
