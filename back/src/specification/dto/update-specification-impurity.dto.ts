import { PartialType } from '@nestjs/mapped-types';
import { CreateSpecificationImpurityDto } from './create-specification-impurity.dto';


export class UpdateSpecificationImpurityDto extends PartialType(CreateSpecificationImpurityDto) {}