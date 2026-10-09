import { PartialType } from '@nestjs/mapped-types';
import {
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

// DTO ایجاد رکورد Step7ScaleUpFinal
export class CreateStep7ScaleUpFinalDto {

  @IsOptional()
  @IsString({ message: 'آدرس فایل سند انتقال تکنولوژی تولید نامعتبر است' })
  productionTechnologyTransferDocumentFileUrl?: string;

  @IsOptional()
  @IsString({ message: 'آدرس فایل سند انتقال تکنولوژی QC نامعتبر است' })
  technologyTransferDocumentQCFileUrl?: string;

  @IsOptional()
  @IsInt({ message: 'شناسه کاربر نامعتبر است' })
  userId?: number;
}

// DTO ویرایش رکورد Step7ScaleUpFinal
export class UpdateStep7ScaleUpFinalDto extends PartialType(CreateStep7ScaleUpFinalDto) {}
