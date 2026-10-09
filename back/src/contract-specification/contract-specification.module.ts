import { Module } from '@nestjs/common';
import { ContractSpecificationController } from './contract-specification.controller';
import { ContractSpecificationService } from './contract-specification.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContractSpecificationController],
  providers: [ContractSpecificationService],
})
export class ContractSpecificationModule {}
