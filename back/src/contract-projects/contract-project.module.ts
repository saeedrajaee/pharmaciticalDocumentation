// contract-project/contract-project.module.ts
import { Module } from '@nestjs/common';
import { ContractProjectController } from './contract-project.controller';
import { ContractProjectService } from './contract-project.service';
import { PrismaService } from '../prisma/prisma.service'; // مسیر سرویس Prisma 
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({  imports: [PrismaModule],
  controllers: [ContractProjectController],
  providers: [ContractProjectService],
})
export class ContractProjectModule {}
