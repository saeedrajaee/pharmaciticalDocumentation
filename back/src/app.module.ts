import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';

import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DrugProductModule } from './drug-product/drug-product.module';
import { SpecificationModule } from './specification/specification.module';
import { BatchModule } from './batch/batch.module';
import { ResultModule } from './result/result.module';
import { ContractProjectModule } from './contract-projects/contract-project.module';
import { StudyController } from './study/study.controller';
import { StudyService } from './study/study.service';
import { StudyModule } from './study/study.module';
import { RawMaterialCoaModule } from './raw-material-coa/raw-material-coa.module';
import { FormulationMaterialsController } from './formulation-materials/formulation-materials.controller';
import { FormulationMaterialsModule } from './formulation-materials/formulation-materials.module';
import { BomService } from './bom/bom.service';
import { BomController } from './bom/bom.controller';
import { BomModule } from './bom/bom.module';
import { PreFurmolaModule } from './pre-furmola/pre-furmola.module';
import { PreFurmolaPackagingService } from './pre-furmola-packaging/pre-furmola-packaging.service';
import { PreFurmolaPackagingController } from './pre-furmola-packaging/pre-furmola-packaging.controller';
import { PreFurmolaPackagingModule } from './pre-furmola-packaging/pre-furmola-packaging.module';
import { AnalyticalDevlopRawModule } from './analytical-devlop-raw/analytical-devlop-raw.module';
import { AnalyticalDevlopFinishedService } from './analytical-devlop-finished/analytical-devlop-finished.service';
import { AnalyticalDevlopFinishedController } from './analytical-devlop-finished/analytical-devlop-finished.controller';
import { AnalyticalDevlopFinishedModule } from './analytical-devlop-finished/analytical-devlop-finished.module';
import { AnalyticalValidRawModule } from './analytical-valid-raw/analytical-valid-raw.module';
import { AnalyticalValidFinishedController } from './analytical-valid-finished/analytical-valid-finished.controller';
import { AnalyticalValidFinishedModule } from './analytical-valid-finished/analytical-valid-finished.module';
import { FurmolationDevelopService } from './furmolation-develop/furmolation-develop.service';
import { FurmolationDevelopModule } from './furmolation-develop/furmolation-develop.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      // process.cwd() دقیقاً به پوشه اصلی پروژه back اشاره می‌کند
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false, // جلوگیری از جستجو برای index.html
      },
    }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    AuthModule,
    UserModule,
    DrugProductModule,
    SpecificationModule,
    BatchModule,
    ResultModule,
    ContractProjectModule,
    StudyModule,
    RawMaterialCoaModule,
    FormulationMaterialsModule,
    BomModule,
    PreFurmolaModule,
    PreFurmolaPackagingModule,
    AnalyticalDevlopRawModule,
    AnalyticalDevlopFinishedModule,
    AnalyticalValidRawModule,
    AnalyticalValidFinishedModule,
    FurmolationDevelopModule,
  ],

})
export class AppModule {}
