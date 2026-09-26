import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateBatchDto {
  @IsDateString()
  batchDate: string;
  @IsOptional()
  @IsString()
  batchNumber?: string;
  @IsOptional()
  @IsString()
  description?: string;
  @IsOptional()
  @IsString()
  uploadDoc?: string;
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  drugProductId: number;
}
