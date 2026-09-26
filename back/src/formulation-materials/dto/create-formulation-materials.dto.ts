import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

function transformBoolean(value: unknown): unknown {
  if (value === true || value === 1 || value === '1' || value === 'true') {
    return true;
  }

  if (value === false || value === 0 || value === '0' || value === 'false') {
    return false;
  }

  return value;
}

// DTO ایجاد رکورد Step3std
export class CreateStep3stdDto {
  @IsString({ message: 'نام استاندارد باید متنی باشد' })
  @IsNotEmpty({ message: 'نام استاندارد الزامی است' })
  stdName: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل نامعتبر است' })
  stdFileUrl?: string;

  @IsOptional()
  @IsString({ message: 'توضیحات باید متنی باشد' })
  description?: string;

  @Transform(({ value }) => transformBoolean(value))
  @IsBoolean({
    message: 'نتیجه مواد فرمولاسیون باید مقدار منطقی باشد',
  })
  resultFormulationMaterials: boolean;
}

// DTO ویرایش رکورد Step3std
export class UpdateStep3stdDto extends PartialType(CreateStep3stdDto) {}
