import { PartialType } from '@nestjs/mapped-types';
import { CreateSpecificationImpurityDto } from './create-result-impurity.dto';


export class UpdateResultImpurityDto extends PartialType(CreateSpecificationImpurityDto) {}