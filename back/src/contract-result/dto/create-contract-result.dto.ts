import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

/**
 * ورودی نتیجه یک ناخالصی.
 *
 * در ورودی جدید از specImpurityId استفاده کنید.
 * فیلد id فقط برای سازگاری موقت با درخواست‌های قدیمی است و به‌عنوان
 * شناسه ContractSpecImpurity در نظر گرفته می‌شود، نه شناسه نتیجه.
 */
export class ContractResultImpurityInputDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specImpurityId?: number;

  // سازگاری با فرانت‌اند/درخواست‌های قدیمی
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  id?: number;

  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  value!: number;

  /*
   * این فیلدها برای سازگاری با payload قدیمی پذیرفته می‌شوند،
   * اما سرویس آن‌ها را در ContractResultImpurity ذخیره نمی‌کند.
   * نام و حد مجاز باید از ContractSpecImpurity خوانده شوند.
   */
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  specificationId?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO اصلی نتیجه ContractResult
 */
export class ContractResultDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  batchId!: number;

  @IsOptional()
  @IsString()
  @IsIn(['Accerator', 'Long'])
  accelrator?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  month!: number;

  @IsOptional()
  @IsBoolean()
  appearance?: boolean;

  @IsOptional()
  @IsBoolean()
  identification1?: boolean;

  @IsOptional()
  @IsBoolean()
  identification2?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  assay?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  pH?: number;

  @IsOptional()
  @IsBoolean()
  clarity?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  particulatedMater25?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  particulatedMater10?: number;

  @IsOptional()
  @IsBoolean()
  leakTest?: boolean;

  @IsOptional()
  @IsBoolean()
  sterility?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  endotoxin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  osmolarity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Max(15)
  uniformityOfDosage?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContractResultImpurityInputDto)
  impurities?: ContractResultImpurityInputDto[];

  // این مقدار در سرویس با شناسه کاربر لاگین‌شده جایگزین می‌شود.
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}

export class CreateContractResultDto extends ContractResultDto {}

export class UpdateContractResultDto extends PartialType(
  ContractResultDto,
) {}
