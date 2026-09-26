import { PartialType } from '@nestjs/mapped-types';
import { CreateDrugProductDto } from './create-drug-product.dto';


export class UpdateDrugProductDto extends PartialType(CreateDrugProductDto) {}