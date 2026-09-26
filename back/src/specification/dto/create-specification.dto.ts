import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';

class SpecificationImpurityDto {
  @IsString()
  name: string;
  @IsNumber()
  value?: number;
  @IsString()
  description?: string;
}

export class CreateSpecificationDto {
  @IsOptional()
  @IsString()
  descriptionAppearance?: string;

  @IsOptional()
  @IsString()
  identification1?: string;

  @IsOptional()
  @IsString()
  identification2?: string;

  @IsOptional()
  @IsNumber()
  assayMin?: number;

  @IsOptional()
  @IsNumber()
  assayMax?: number;

  @IsOptional()
  @IsNumber()
  pHMin?: number;

  @IsOptional()
  @IsNumber()
  pHMax?: number;

  @IsOptional()
  @IsString()
  clarity?: string;

  @IsOptional()
  @IsNumber()
  particulatedMater25?: number;

  @IsOptional()
  @IsNumber()
  particulatedMater10?: number;

  @IsOptional()
  @IsString()
  sterility?: string;

  @IsOptional()
  @IsString()
  leakTest?: string;

  @IsOptional()
  @IsNumber()
  endotoxin?: number;

  @IsOptional()
  @IsNumber()
  osmolarityMin?: number;

  @IsOptional()
  @IsNumber()
  osmolarityMax?: number;

  @IsOptional()
  @IsNumber()
  preservativeContent?: number;

  @IsOptional()
  @IsString()
  uniformityOfDosage?: string;

  @IsInt()
  drugProductId: number;

  @IsOptional()
  @IsInt()
  userId?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecificationImpurityDto)
  impurities?: SpecificationImpurityDto[];
}

export class UpdateSpecificationDto extends PartialType(
  CreateSpecificationDto,
) {}
