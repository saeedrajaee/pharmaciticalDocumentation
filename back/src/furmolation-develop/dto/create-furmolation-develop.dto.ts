import { PartialType } from '@nestjs/mapped-types';
import { IsDate, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStep7FormulationDevelopmentDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'فرمول باید متنی باشد' })
  furmol?: string;

  /**
   * تبدیل تاریخ دریافتی (از نوع string یا Date یا timestamp) به شیء Date معتبر
   * در صورت خالی بودن رشته، undefined برمی‌گرداند تا مقدار پیش‌فرض دیتابیس اعمال شود
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (!value || value === '') return undefined;
    const parsedDate = new Date(value);
    return isNaN(parsedDate.getTime()) ? value : parsedDate;
  })
  @IsDate({ message: 'فرمت تاریخ نامعتبر است' })
  date?: Date;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'روش ساخت (Manufacturing Method) باید متنی باشد' })
  manufacturingMethod?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'نوع بسته‌بندی (Packaging) باید متنی باشد' })
  packaging?: string;
}

export class UpdateStep7FormulationDevelopmentDto extends PartialType(
  CreateStep7FormulationDevelopmentDto,
) {}
