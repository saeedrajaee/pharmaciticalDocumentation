import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsString } from 'class-validator';

// DTO for creating a packaging record
export class CreatePackagingDto {
  @IsString({ message: 'نام پکیجینگ الزامی است' })
  packaagingName: string;

  @IsOptional()
  @IsString({ message: 'نام سازنده باید متنی باشد' })
  manufactor?: string;

  @IsOptional()
  @IsString({ message: 'فایل COA باید متنی باشد' })
  coa?: string;

  @IsOptional()
  @IsString({ message: 'فایل URS باید متنی باشد' })
  urs?: string;
}

// DTO for updating a packaging record
export class UpdatePackagingDto extends PartialType(CreatePackagingDto) {}
