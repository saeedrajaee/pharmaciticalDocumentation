import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { BomService } from './bom.service';
import { BomController } from './bom.controller';

@Module({
    imports: [PrismaModule],
  providers: [BomService],
  controllers: [BomController],
})
export class BomModule {}





