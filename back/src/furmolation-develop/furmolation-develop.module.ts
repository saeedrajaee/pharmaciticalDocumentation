import { Module } from '@nestjs/common';
import { FurmolationDevelopController } from './furmolation-develop.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FurmolationDevelopService } from './furmolation-develop.service';

@Module({
  imports: [PrismaModule],
  controllers: [FurmolationDevelopController],
  providers: [FurmolationDevelopService],
})
export class FurmolationDevelopModule {}
