import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ResultController } from './result.controller';
import { ResultService } from './result.service';

@Module({
  imports: [PrismaModule],
  controllers: [ResultController],
  providers: [ResultService],
})
export class ResultModule {}
