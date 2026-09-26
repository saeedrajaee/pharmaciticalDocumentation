import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PreFurmolaPackagingService } from './pre-furmola-packaging.service';
import { PreFurmolaPackagingController } from './pre-furmola-packaging.controller';

@Module({
    imports: [PrismaModule],
      providers: [PreFurmolaPackagingService],
  controllers: [PreFurmolaPackagingController],
})
export class PreFurmolaPackagingModule {}
