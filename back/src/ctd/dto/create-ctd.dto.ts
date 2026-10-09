  import { PartialType } from '@nestjs/mapped-types';
  import { Type } from 'class-transformer';
  import {
    IsDate,
    IsInt,
    IsOptional,
    IsString,
  } from 'class-validator';

  // DTO ایجاد رکورد Step8CtdModule
  export class CreateStep8CtdModuleDto {

    @IsOptional()
    @IsString({ message: 'آدرس فایل پرونده CTD نامعتبر است' })
    ctdFileUrl?: string;

    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'تاریخ تاییدیه سازمان غذا و دارو نامعتبر است' })
    fdaApproval?: Date;

    @IsOptional()
    @IsString({ message: 'شماره نامه تاییدیه نامعتبر است' })
    fdaApprovalLetterNumber?: string;

    @IsOptional()
    @IsString({ message: 'آدرس فایل نامه تاییدیه سازمان غذا و دارو نامعتبر است' })
    fdaApprovalLetterFileUrl?: string;

    @IsOptional()
    @IsInt({ message: 'شناسه کاربر نامعتبر است' })
    userId?: number;
  }

  // DTO ویرایش رکورد Step8CtdModule
  export class UpdateStep8CtdModuleDto extends PartialType(CreateStep8CtdModuleDto) {}
