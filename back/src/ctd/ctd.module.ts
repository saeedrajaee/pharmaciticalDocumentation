import { Module } from '@nestjs/common';
import { CtdController } from './ctd.controller';
import { CtdService } from './ctd.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
  controllers: [CtdController],
  providers: [CtdService]
})
export class CtdModule {}
