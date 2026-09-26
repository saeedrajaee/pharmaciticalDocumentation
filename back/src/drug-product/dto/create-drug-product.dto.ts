import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateDrugProductDto {
  @IsString()
  finishedProductName: string;

  @IsString()
  api: string;

  @IsString()
  @IsIn(['Solution', 'Solid', 'Semisolid'])
  dosageForm: string;

  @IsString()
  strength: string;

  @IsString()
  strengthUnit: string;

  @IsString()
  strongCondition: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;
}
