import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// DTO ایجاد رکورد Step6ScaleUpTrial
export class CreateStep6ScaleUpTrialDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شناسه پروژه نامعتبر است' })
  projectId?: number;

  @IsString({ message: 'شماره/شرح بچ نامعتبر است' })
  @IsNotEmpty({ message: 'وارد کردن بچ الزامی است' })
  batchNumber: string;

  @IsString({ message: 'فرآیند تولید Scale-up نامعتبر است' })
  @IsNotEmpty({ message: 'شرح فرآیند تولید الزامی است' })
  scaleUpManufacturingProcess: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل گزارش نامعتبر است' })
  reportFileUrl?: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل فرآیند تولید نامعتبر است' })
  manufacturingProcessFileUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'شناسه کاربر نامعتبر است' })
  userId?: number;
}

// DTO ویرایش رکورد Step6ScaleUpTrial
export class UpdateStep6ScaleUpTrialDto extends PartialType(CreateStep6ScaleUpTrialDto) {}
