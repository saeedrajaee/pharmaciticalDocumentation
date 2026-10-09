import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ContractResultService } from './contract-result.service';
import { ContractResultController } from './contract-result.controller';

@Module({
  imports: [PrismaModule],
  providers: [ContractResultService],
  controllers: [ContractResultController],
})
export class ContractResultModule {}
