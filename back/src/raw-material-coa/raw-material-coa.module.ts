import { Module } from '@nestjs/common';
import { RawMaterialCoaService } from './raw-material-coa.service';
import { RawMaterialCoaController } from './raw-material-coa.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({  imports: [PrismaModule],
  providers: [RawMaterialCoaService],
  controllers: [RawMaterialCoaController]
})
export class RawMaterialCoaModule {}
