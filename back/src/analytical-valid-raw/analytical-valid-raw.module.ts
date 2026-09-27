import { Module } from '@nestjs/common';
import { AnalyticalValidRawService } from './analytical-valid-raw.service';
import { AnalyticalValidRawController } from './analytical-valid-raw.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticalValidRawService],
  controllers: [AnalyticalValidRawController],
})
export class AnalyticalValidRawModule {}
