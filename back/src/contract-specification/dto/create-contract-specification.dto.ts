import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { StabilityStage } from '@prisma/client';

/* ==========================================================================
   1. Impurity DTO (تعریف مشخصات و حدود مجاز ناخالصی‌ها در Spec)
   ========================================================================== */
export class ContractSpecImpurityDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @IsString()
  name: string;

  /**
   * حد مجاز ناخالصی (NMT / Upper Limit)
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  limit?: number;

  /**
   * برای سازگاری کامل با فرم‌ها یا کلاینت‌هایی که قبلاً فیلد limit را به عنوان value ارسال می‌کردند
   */
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  value?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

// برای ایجاد ناخالصی به صورت مستقل
export class CreateContractSpecImpurityDto extends ContractSpecImpurityDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specificationId: number;
}

export class UpdateContractSpecImpurityDto extends PartialType(
  CreateContractSpecImpurityDto,
) {}

/* ==========================================================================
   2. Contract Specification DTOs
   ========================================================================== */
export class CreateContractSpecificationDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  projectId: number;

  @IsOptional()
  @IsEnum(StabilityStage)
  stage?: StabilityStage;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @IsOptional()
  @IsString()
  descriptionAppearance?: string;

  @IsOptional()
  @IsString()
  identification1?: string;

  @IsOptional()
  @IsString()
  identification2?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  assayMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  assayMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  pHMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  pHMax?: number;

  @IsOptional()
  @IsString()
  clarity?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  particulatedMater25?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  particulatedMater10?: number;

  @IsOptional()
  @IsString()
  sterility?: string;

  @IsOptional()
  @IsString()
  leakTest?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  endotoxin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  osmolarityMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  osmolarityMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  preservativeContent?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  uniformityOfDosage?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractSpecImpurityDto)
  impurities?: ContractSpecImpurityDto[];
}

export class UpdateContractSpecificationDto extends PartialType(
  CreateContractSpecificationDto,
) {}
