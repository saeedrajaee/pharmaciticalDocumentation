import {
  IsString,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

// ==========================================
// DTO برای ایجاد رکورد جدید در گام ۱
// ==========================================
export class CreateStep1LiteratureStudyDto {
  @IsString({ message: 'نوع مطالعه باید رشته باشد' })
  @IsNotEmpty({ message: 'نوع مطالعه (Type) الزامی است' })
  type: string; // مثال: "Article", "Patent", "Regulation"

  @IsString({ message: 'عنوان مطالعه باید رشته باشد' })
  @IsNotEmpty({ message: 'عنوان مطالعه الزامی است' })
  title: string;

  @IsString({ message: 'مرجع/سورس باید رشته باشد' })
  @IsNotEmpty({ message: 'مرجع/سورس الزامی است' })
  reference: string;

  @IsString({ message: 'خلاصه باید رشته باشد' })
  @IsOptional()
  summary?: string;

  @IsString({ message: 'آدرس فایل نامعتبر است' })
  @IsOptional()
  fileUrl?: string;
}

// ==========================================
// DTO برای ویرایش رکورد (با استفاده از PartialType)
// این کلاس به صورت خودکار تمام فیلدهای بالایی را Optional می‌کند
// ==========================================
export class UpdateStep1LiteratureStudyDto extends PartialType(CreateStep1LiteratureStudyDto) {}
