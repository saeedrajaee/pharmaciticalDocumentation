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
import { StudyModule } from './study/study.module';
import { RawMaterialCoaModule } from './raw-material-coa/raw-material-coa.module';
import { FormulationMaterialsModule } from './formulation-materials/formulation-materials.module';
import { BomModule } from './bom/bom.module';
import { PreFurmolaModule } from './pre-furmola/pre-furmola.module';
import { PreFurmolaPackagingModule } from './pre-furmola-packaging/pre-furmola-packaging.module';
import { AnalyticalDevlopRawModule } from './analytical-devlop-raw/analytical-devlop-raw.module';
import { AnalyticalDevlopFinishedModule } from './analytical-devlop-finished/analytical-devlop-finished.module';
import { AnalyticalValidRawModule } from './analytical-valid-raw/analytical-valid-raw.module';
import { AnalyticalValidFinishedModule } from './analytical-valid-finished/analytical-valid-finished.module';
import { FurmolationDevelopModule } from './furmolation-develop/furmolation-develop.module';
import { ContractSpecificationModule } from './contract-specification/contract-specification.module';
import { ContractBatchController } from './contract-batch/contract-batch.controller';
import { ContractBatchModule } from './contract-batch/contract-batch.module';
import { ContractResultService } from './contract-result/contract-result.service';
import { ContractResultController } from './contract-result/contract-result.controller';
import { ContractResultModule } from './contract-result/contract-result.module';
import { ScaleUpTrialModule } from './scale-up-trial/scale-up-trial.module';
import { ScaleUpFinalService } from './scale-up-final/scale-up-final.service';
import { ScaleUpFinalController } from './scale-up-final/scale-up-final.controller';
import { ScaleUpFinalModule } from './scale-up-final/scale-up-final.module';
import { CtdModule } from './ctd/ctd.module';

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
    ContractSpecificationModule,
    ContractBatchModule,
    ContractResultModule,
    ScaleUpTrialModule,
    ScaleUpFinalModule,
    CtdModule,
  ],

})
export class AppModule {}
