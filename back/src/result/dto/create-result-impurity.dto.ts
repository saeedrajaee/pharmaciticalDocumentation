import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateSpecificationImpurityDto {
  @IsString()
  name: string;
  @IsNumber()
  value?: number;
  @IsString()
  description?: string;
}