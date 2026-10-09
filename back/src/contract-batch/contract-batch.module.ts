import { Module } from '@nestjs/common';
import { ContractBatchService } from './contract-batch.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ContractBatchController } from './contract-batch.controller';

@Module({
  imports: [PrismaModule],
  providers: [ContractBatchService],
  controllers: [ContractBatchController],
})
export class ContractBatchModule {}
