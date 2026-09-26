import { PartialType } from '@nestjs/mapped-types';
import {
  IsOptional,
  IsString,
} from 'class-validator';

// DTO ایجاد رکورد Step2FormulaBom
export class CreateStep2FormulaBomDto {
  @IsOptional()
  @IsString({ message: 'آدرس فایل نامعتبر است' })
  bomFileUrl?: string;
}

// DTO ویرایش رکورد Step2FormulaBom
export class UpdateStep2FormulaBomDto extends PartialType(CreateStep2FormulaBomDto) {}
