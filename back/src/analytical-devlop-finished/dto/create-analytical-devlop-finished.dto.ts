import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';

// DTO ایجاد / ثبت اولیه رکورد Step5AnalyticalDevlopFinished
export class CreateStep5AnalyticalDevlopFinishedDto {
  @IsString({ message: 'فارماکوپه نامعتبر است' })
  @IsNotEmpty({ message: 'انتخاب یا ورود فارماکوپه الزامی است' })
  pharmacopia: string;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString({ message: 'آدرس فایل فارماکوپه نامعتبر است' })
  pharmacopiaFileUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString({ message: 'آدرس فایل مشخصات (Specification) نامعتبر است' })
  specFileUrl?: string | null;

  @IsOptional()
  @ValidateIf((_, v) => v !== null && v !== undefined && v !== '')
  @IsString({ message: 'آدرس فایل روش آنالیز (MOA) نامعتبر است' })
  moaFileUrl?: string | null;
}

// DTO ویرایش رکورد Step5AnalyticalDevlopFinished
export class UpdateStep5AnalyticalDevlopFinishedDto extends PartialType(
  CreateStep5AnalyticalDevlopFinishedDto,
) {}
