import { PartialType } from '@nestjs/mapped-types';
import { CreateContractProjectDto } from './create-contract-project.dto';


export class UpdateContractProjectDto extends PartialType(CreateContractProjectDto) {}