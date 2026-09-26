import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AnalyticalDevlopFinishedService } from './analytical-devlop-finished.service';
import { AnalyticalDevlopFinishedController } from './analytical-devlop-finished.controller';

@Module({
  imports: [PrismaModule],
  providers: [AnalyticalDevlopFinishedService],
  controllers: [AnalyticalDevlopFinishedController],
})
export class AnalyticalDevlopFinishedModule {}
