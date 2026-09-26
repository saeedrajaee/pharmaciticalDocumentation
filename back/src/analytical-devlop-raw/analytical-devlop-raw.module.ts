import { Module } from '@nestjs/common';
import { AnalyticalDevlopRawController } from './analytical-devlop-raw.controller';
import { AnalyticalDevlopRawService } from './analytical-devlop-raw.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
      imports: [PrismaModule],
  controllers: [AnalyticalDevlopRawController],
  providers: [AnalyticalDevlopRawService]
})
export class AnalyticalDevlopRawModule {}
