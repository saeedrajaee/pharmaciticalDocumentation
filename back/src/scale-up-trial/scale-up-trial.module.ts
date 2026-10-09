import { Module } from '@nestjs/common';
import { ScaleUpTrialController } from './scale-up-trial.controller';
import { ScaleUpTrialService } from './scale-up-trial.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ScaleUpTrialController],
  providers: [ScaleUpTrialService],
})
export class ScaleUpTrialModule {}
