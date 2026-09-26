import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateStep3RawMaterialCoaDto {
  @IsString({ message: 'نام ماده باید رشته باشد' })
  @IsNotEmpty({ message: 'نام ماده الزامی است' })
  materialName: string;

  @IsString({ message: 'نام تولیدکننده باید رشته باشد' })
  @IsNotEmpty({ message: 'نام تولیدکننده الزامی است' })
  manufacturer: string;

  @IsOptional()
  @IsString({ message: 'فارماکوپه باید رشته باشد' })
  pharmaCopia?: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل فارماکوپه نامعتبر است' })
  pharmaCopiaFileUrl?: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل COA نامعتبر است' })
  coaFileUrl?: string;

  // تبدیل مقادیر FormData مثل "true" و "false" به Boolean
  @Transform(({ value }) => {
    if (value === 'true' || value === true || value === 1 || value === '1') {
      return true;
    }

    if (value === 'false' || value === false || value === 0 || value === '0') {
      return false;
    }

    return value;
  })
  @IsBoolean({
    message: 'وضعیت بررسی QC باید مقدار منطقی باشد',
  })
  chekedByQC: boolean;
}

export class UpdateStep3RawMaterialCoaDto extends PartialType(
  CreateStep3RawMaterialCoaDto,
) {}
