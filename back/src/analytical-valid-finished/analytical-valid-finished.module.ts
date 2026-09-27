import { Module } from '@nestjs/common';
import { AnalyticalValidFinishedService } from './analytical-valid-finished.service';
import { AnalyticalValidFinishedController } from './analytical-valid-finished.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
  providers: [AnalyticalValidFinishedService],
    controllers: [AnalyticalValidFinishedController],
})
export class AnalyticalValidFinishedModule {}
