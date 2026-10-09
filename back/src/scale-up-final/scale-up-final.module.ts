import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ScaleUpFinalService } from './scale-up-final.service';
import { ScaleUpFinalController } from './scale-up-final.controller';

@Module({
  imports: [PrismaModule],
  providers: [ScaleUpFinalService],
  controllers: [ScaleUpFinalController],
})
export class ScaleUpFinalModule {}
