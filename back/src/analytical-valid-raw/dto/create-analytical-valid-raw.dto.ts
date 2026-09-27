import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateStep5AnalyticalDevlopRawDto {
  /**
   * تبدیل رشته‌های دریافتی از FormData مثل "true" یا "false" به boolean واقعی
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean({ message: 'مقدار فارماکوپه نامعتبر است' })
  pharmacopia?: boolean;

  @IsOptional()
  @IsString({ message: 'آدرس فایل Assay نامعتبر است' })
  assayFileUrl?: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل Impurity نامعتبر است' })
  impurityFileUrl?: string;
}

export class UpdateStep5AnalyticalDevlopRawDto extends PartialType(
  CreateStep5AnalyticalDevlopRawDto,
) {}
