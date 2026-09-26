import { Module } from '@nestjs/common';
import { FormulationMaterialsService } from './formulation-materials.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { FormulationMaterialsController } from './formulation-materials.controller';

@Module({
    imports: [PrismaModule],
      controllers: [FormulationMaterialsController],
  providers: [FormulationMaterialsService]
})
export class FormulationMaterialsModule {}
