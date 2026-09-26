import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

// ۱. DTO برای جزئیات (مربوط به مودال دوم)
export class CreatePreFormulationPartDto {
  @IsOptional()
  @IsString({ message: 'نام اجزا باید متنی باشد' })
  componentsName?: string;

  @IsOptional()
  @IsNumber({}, { message: 'مقدار اجزا باید عدد باشد' })
  componentsAmount?: number;

  @IsOptional()
  @IsString({ message: 'نقش اجزا باید متنی باشد' })
  componentsRole?: string;

  @IsOptional()
  @IsString({ message: 'فرآیند ساخت باید متنی باشد' })
  manufacturingProcess?: string;
}

// ۲. DTO برای ایجاد رکورد اصلی (شامل بخش‌ها)
export class CreatePreFormulationDto {
  @IsString({ message: 'فیلد فرمول الزامی است' })
  formul: string;

  @IsOptional()
  @IsString({ message: 'توضیحات باید متنی باشد' })
  description?: string;

  @IsOptional()
  @IsArray({ message: 'جزئیات باید به صورت آرایه باشد' })
  @ValidateNested({ each: true })
  @Type(() => CreatePreFormulationPartDto)
  parts?: CreatePreFormulationPartDto[];
}

// ۳. DTO ویرایش (با استفاده از PartialType)
export class UpdatePreFormulationDto extends PartialType(
  CreatePreFormulationDto,
) {
  // اگر نیاز به ویرایش لیست پارت‌ها به صورت کامل باشد
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePreFormulationPartDto)
  parts?: CreatePreFormulationPartDto[];
}
