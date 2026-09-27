import { PartialType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';

// DTO ایجاد / ثبت اولیه رکورد Step6AnalyticalValidFinished
export class CreateStep6AnalyticalValidFinishedDto {
  /**
   * در multipart/form-data مقدار boolean معمولاً به صورت string می‌آید ("true"/"false")
   * بنابراین قبل از validate به boolean تبدیل می‌کنیم.
   */
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') return true;
    if (value === 'false' || value === false || value === 0 || value === '0') return false;
    return value;
  })
  @IsBoolean({ message: 'فارماکوپه نامعتبر است' })
  pharmacopia?: boolean;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString({ message: 'آدرس فایل Assay نامعتبر است' })
  assayFileUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString({ message: 'آدرس فایل Impurity نامعتبر است' })
  impurityFileUrl?: string | null;
}

// DTO ویرایش رکورد Step6AnalyticalValidFinished
export class UpdateStep6AnalyticalValidFinishedDto extends PartialType(
  CreateStep6AnalyticalValidFinishedDto,
) {}
