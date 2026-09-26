import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

// DTO ایجاد رکورد Step5AnalyticalDevlopRaw
export class CreateStep5AnalyticalDevlopRawDto {

  @IsString({ message: 'نام نامعتبر است' })
  name: string;

  @IsOptional()
  @IsString({ message: 'نام تولیدکننده نامعتبر است' })
  manufactor?: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل مشخصات نامعتبر است' })
  specFileUrl?: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل روش آنالیز نامعتبر است' })
  moaFileUrl?: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل DMF نامعتبر است' })
  dmfFileUrl?: string;
}

// DTO ویرایش رکورد Step5AnalyticalDevlopRaw
export class UpdateStep5Step5AnalyticalDevlopRawDto extends PartialType(
  CreateStep5AnalyticalDevlopRawDto,
) {}
