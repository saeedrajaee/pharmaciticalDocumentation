import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateResultImpurityDto {
  @IsString()
  name: string;

  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  value: number;

  @IsString()
  description: string;
}

export class CreateResultDto {
  @IsOptional()
  @IsString()
  @IsIn(['Accerator', 'Long'])
  accelrator?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  month?: number;

  @IsOptional()
  @IsBoolean()
  appearance?: boolean;

  @IsOptional()
  @IsBoolean()
  identification1?: boolean;

  @IsOptional()
  @IsBoolean()
  identification2?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  assay?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  pH?: number;

  @IsOptional()
  @IsBoolean()
  clarity?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  particulatedMater25?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  particulatedMater10?: number;

  @IsOptional()
  @IsBoolean()
  leakTest?: boolean;

  @IsOptional()
  @IsBoolean()
  sterility?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  endotoxin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  osmolarity?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({
    allowNaN: false,
    allowInfinity: false,
  })
  @Max(15)
  uniformityOfDosage?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateResultImpurityDto)
  impurities?: CreateResultImpurityDto[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  batchId: number;
}
