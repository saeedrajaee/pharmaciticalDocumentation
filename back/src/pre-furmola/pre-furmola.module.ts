import { Module } from '@nestjs/common';
import { PreFurmolaController } from './pre-furmola.controller';
import { PreFurmolaService } from './pre-furmola.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({    imports: [PrismaModule],
  controllers: [PreFurmolaController],
  providers: [PreFurmolaService]
})
export class PreFurmolaModule {}
