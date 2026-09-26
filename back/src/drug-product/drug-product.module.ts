import { Module } from '@nestjs/common';
import { DrugProductController } from './drug-product.controller';
import { DrugProductService } from './drug-product.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DrugProductController],
  providers: [DrugProductService],
})
export class DrugProductModule {}
