-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EXPERT', 'USER', 'EXRD', 'MGRD', 'EXQC', 'MGQC', 'EXQA', 'MGQA', 'EXP', 'MGP');

-- CreateEnum
CREATE TYPE "DrugProductStatus" AS ENUM ('SUBMITTED', 'REFERRED_TO_EXPERT', 'RETURNED_BY_EXPERT', 'NEED_MORE_INFO', 'RESUBMITTED_BY_APPLICANT', 'RESULT_SUBMITTED', 'SENT_TO_USER', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DrugProductActorType" AS ENUM ('ADMIN', 'EXPERTRD', 'MANEAGERRD', 'EXPERTQC', 'MANEAGERQC', 'EXPERTQA', 'MANEAGERQA', 'EXPERTP', 'MANEAGERP', 'APPLICANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ProjectStep" AS ENUM ('STEP_1_TO_4', 'STEP_5_MOA_SPEC', 'STEP_6_FINAL_SPEC', 'STEP_7_STABILITY_FP', 'STEP_8_FORMULATION_TANKS', 'STEP_9_SCALE_UP', 'STEP_10_STABILITY_SCALE_UP', 'STEP_11_CTD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'PENDING_RD_REVIEW', 'REJECTED_RD', 'APPROVED_RD', 'COMPLETED');

-- CreateEnum
CREATE TYPE "StabilityStage" AS ENUM ('FINISHED_PRODUCT', 'SCALE_UP');

-- CreateEnum
CREATE TYPE "StabilityCondition" AS ENUM ('ACCELERATED', 'LONG_TERM', 'INTERMEDIATE');

-- CreateEnum
CREATE TYPE "ReviewAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "hashedRefreshToken" TEXT,
    "expertProvince" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DrugProduct" (
    "id" SERIAL NOT NULL,
    "finishedProductName" TEXT NOT NULL,
    "api" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "strengthUnit" TEXT NOT NULL,
    "strongCondition" TEXT NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrugProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Specification" (
    "id" SERIAL NOT NULL,
    "descriptionAppearance" TEXT,
    "identification1" TEXT,
    "identification2" TEXT,
    "assayMin" DOUBLE PRECISION,
    "assayMax" DOUBLE PRECISION,
    "pHMin" DOUBLE PRECISION,
    "pHMax" DOUBLE PRECISION,
    "clarity" TEXT,
    "particulatedMater25" DOUBLE PRECISION,
    "particulatedMater10" DOUBLE PRECISION,
    "sterility" TEXT,
    "leakTest" TEXT,
    "endotoxin" DOUBLE PRECISION,
    "osmolarityMin" DOUBLE PRECISION,
    "osmolarityMax" DOUBLE PRECISION,
    "preservativeContent" DOUBLE PRECISION,
    "uniformityOfDosage" TEXT,
    "drugProductId" INTEGER NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Specification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "batchDate" TIMESTAMP(3) NOT NULL,
    "batchNumber" TEXT,
    "description" TEXT,
    "uploadDoc" TEXT,
    "userId" INTEGER,
    "drugProductId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" SERIAL NOT NULL,
    "accelrator" TEXT,
    "month" INTEGER,
    "appearance" BOOLEAN NOT NULL DEFAULT true,
    "identification1" BOOLEAN NOT NULL DEFAULT true,
    "identification2" BOOLEAN NOT NULL DEFAULT true,
    "assay" DOUBLE PRECISION,
    "pH" DOUBLE PRECISION,
    "clarity" BOOLEAN NOT NULL DEFAULT true,
    "particulatedMater25" DOUBLE PRECISION,
    "particulatedMater10" DOUBLE PRECISION,
    "leakTest" BOOLEAN NOT NULL DEFAULT true,
    "sterility" BOOLEAN NOT NULL DEFAULT true,
    "endotoxin" DOUBLE PRECISION,
    "osmolarity" DOUBLE PRECISION,
    "uniformityOfDosage" DOUBLE PRECISION,
    "batchId" INTEGER NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpecificationImpurity" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "description" TEXT,
    "specificationId" INTEGER,
    "resultId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpecificationImpurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectReviewLog" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "step" "ProjectStep" NOT NULL,
    "action" "ReviewAction" NOT NULL,
    "comment" TEXT,
    "reviewerId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractProject" (
    "id" SERIAL NOT NULL,
    "projectCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "apiName" TEXT NOT NULL,
    "dosageForm" TEXT NOT NULL,
    "strength" TEXT NOT NULL,
    "developerName" TEXT NOT NULL,
    "developerPhone" TEXT NOT NULL,
    "step" TEXT,
    "currentStep" "ProjectStep" NOT NULL DEFAULT 'STEP_1_TO_4',
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step1LiteratureStudy" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "userId" INTEGER,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "summary" TEXT,
    "fileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step1LiteratureStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step2FormulaBom" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "bomFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step2FormulaBom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step3RawMaterialCoa" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "materialName" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "pharmaCopia" TEXT,
    "pharmaCopiaFileUrl" TEXT,
    "coaFileUrl" TEXT,
    "chekedByQC" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step3RawMaterialCoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step3std" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stdName" TEXT NOT NULL,
    "stdFileUrl" TEXT,
    "description" TEXT,
    "resultFormulationMaterials" BOOLEAN NOT NULL,
    "userId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step3std_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step4PreFormulation" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "formul" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step4PreFormulation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step4PreFormulationPart" (
    "id" SERIAL NOT NULL,
    "step4PreFormulationId" INTEGER NOT NULL,
    "componentsName" TEXT,
    "componentsAmount" DOUBLE PRECISION,
    "componentsRole" TEXT,
    "manufacturingProcess" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step4PreFormulationPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step4Packaging" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "packaagingName" TEXT NOT NULL,
    "manufactor" TEXT,
    "coa" TEXT,
    "urs" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step4Packaging_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step5AnalyticalDevlopRaw" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "manufactor" TEXT,
    "specFileUrl" TEXT,
    "moaFileUrl" TEXT,
    "dmfFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step5AnalyticalDevlopRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step5AnalyticalDevlopFinished" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "pharmacopia" TEXT NOT NULL,
    "pharmacopiaFileUrl" TEXT,
    "specFileUrl" TEXT,
    "moaFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step5AnalyticalDevlopFinished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step6AnalyticalValidpRaw" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "pharmacopia" BOOLEAN NOT NULL DEFAULT true,
    "assayFileUrl" TEXT,
    "impurityFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step6AnalyticalValidpRaw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step6AnalyticalValidFinished" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "pharmacopia" BOOLEAN NOT NULL DEFAULT true,
    "assayFileUrl" TEXT,
    "impurityFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step6AnalyticalValidFinished_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSpecification" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stage" "StabilityStage" NOT NULL DEFAULT 'FINISHED_PRODUCT',
    "descriptionAppearance" TEXT,
    "identification1" TEXT,
    "identification2" TEXT,
    "assayMin" DOUBLE PRECISION,
    "assayMax" DOUBLE PRECISION,
    "pHMin" DOUBLE PRECISION,
    "pHMax" DOUBLE PRECISION,
    "clarity" TEXT,
    "particulatedMater25" DOUBLE PRECISION,
    "particulatedMater10" DOUBLE PRECISION,
    "sterility" TEXT,
    "leakTest" TEXT,
    "endotoxin" DOUBLE PRECISION,
    "osmolarityMin" DOUBLE PRECISION,
    "osmolarityMax" DOUBLE PRECISION,
    "preservativeContent" DOUBLE PRECISION,
    "uniformityOfDosage" DOUBLE PRECISION DEFAULT 15.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractSpecification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractSpecImpurity" (
    "id" SERIAL NOT NULL,
    "specificationId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "limit" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractSpecImpurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractBatch" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "stage" "StabilityStage" NOT NULL DEFAULT 'FINISHED_PRODUCT',
    "batchNumber" TEXT NOT NULL,
    "batchDate" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "uploadDoc" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractResult" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "condition" "StabilityCondition" NOT NULL,
    "month" INTEGER NOT NULL,
    "appearance" BOOLEAN NOT NULL DEFAULT true,
    "identification1" BOOLEAN NOT NULL DEFAULT true,
    "identification2" BOOLEAN NOT NULL DEFAULT true,
    "assay" DOUBLE PRECISION,
    "pH" DOUBLE PRECISION,
    "clarity" BOOLEAN NOT NULL DEFAULT true,
    "particulatedMater25" DOUBLE PRECISION,
    "particulatedMater10" DOUBLE PRECISION,
    "leakTest" BOOLEAN NOT NULL DEFAULT true,
    "sterility" BOOLEAN NOT NULL DEFAULT true,
    "endotoxin" DOUBLE PRECISION,
    "osmolarity" DOUBLE PRECISION,
    "uniformityOfDosage" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContractResultImpurity" (
    "id" SERIAL NOT NULL,
    "resultId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractResultImpurity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step8FormulationBOM" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "materialName" TEXT NOT NULL,
    "standardGrade" TEXT NOT NULL,
    "unitFormula" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "batchQuantity" DOUBLE PRECISION NOT NULL,
    "batchUnit" TEXT NOT NULL,
    "formulaFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Step8FormulationBOM_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step8ManufacturingTank" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "tankTag" TEXT NOT NULL,
    "tankCapacity" DOUBLE PRECISION NOT NULL,
    "tankMaterial" TEXT NOT NULL,
    "filterSpecs" TEXT,
    "flowDiagramUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Step8ManufacturingTank_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step9ScaleUpTrial" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "scaleUpDate" TIMESTAMP(3) NOT NULL,
    "batchSize" DOUBLE PRECISION NOT NULL,
    "reportFileUrl" TEXT NOT NULL,
    "observations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Step9ScaleUpTrial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Step11CtdModule" (
    "id" SERIAL NOT NULL,
    "projectId" INTEGER NOT NULL,
    "moduleSection" TEXT NOT NULL,
    "sectionTitle" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "version" TEXT,
    "approvedByRd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Step11CtdModule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_mobile_key" ON "User"("mobile");

-- CreateIndex
CREATE UNIQUE INDEX "Specification_drugProductId_key" ON "Specification"("drugProductId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractProject_projectCode_key" ON "ContractProject"("projectCode");

-- CreateIndex
CREATE INDEX "Step1LiteratureStudy_projectId_idx" ON "Step1LiteratureStudy"("projectId");

-- CreateIndex
CREATE INDEX "Step1LiteratureStudy_userId_idx" ON "Step1LiteratureStudy"("userId");

-- CreateIndex
CREATE INDEX "Step2FormulaBom_projectId_idx" ON "Step2FormulaBom"("projectId");

-- CreateIndex
CREATE INDEX "Step2FormulaBom_userId_idx" ON "Step2FormulaBom"("userId");

-- CreateIndex
CREATE INDEX "Step3RawMaterialCoa_projectId_idx" ON "Step3RawMaterialCoa"("projectId");

-- CreateIndex
CREATE INDEX "Step3RawMaterialCoa_userId_idx" ON "Step3RawMaterialCoa"("userId");

-- CreateIndex
CREATE INDEX "Step3std_projectId_idx" ON "Step3std"("projectId");

-- CreateIndex
CREATE INDEX "Step3std_userId_idx" ON "Step3std"("userId");

-- CreateIndex
CREATE INDEX "Step4PreFormulation_projectId_idx" ON "Step4PreFormulation"("projectId");

-- CreateIndex
CREATE INDEX "Step4PreFormulation_userId_idx" ON "Step4PreFormulation"("userId");

-- CreateIndex
CREATE INDEX "Step4PreFormulationPart_userId_idx" ON "Step4PreFormulationPart"("userId");

-- CreateIndex
CREATE INDEX "Step4Packaging_projectId_idx" ON "Step4Packaging"("projectId");

-- CreateIndex
CREATE INDEX "Step4Packaging_userId_idx" ON "Step4Packaging"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Step5AnalyticalDevlopFinished_projectId_key" ON "Step5AnalyticalDevlopFinished"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Step6AnalyticalValidFinished_projectId_key" ON "Step6AnalyticalValidFinished"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractSpecification_projectId_stage_key" ON "ContractSpecification"("projectId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "ContractBatch_projectId_stage_batchNumber_key" ON "ContractBatch"("projectId", "stage", "batchNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ContractResult_batchId_condition_month_key" ON "ContractResult"("batchId", "condition", "month");

-- AddForeignKey
ALTER TABLE "DrugProduct" ADD CONSTRAINT "DrugProduct_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specification" ADD CONSTRAINT "Specification_drugProductId_fkey" FOREIGN KEY ("drugProductId") REFERENCES "DrugProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specification" ADD CONSTRAINT "Specification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_drugProductId_fkey" FOREIGN KEY ("drugProductId") REFERENCES "DrugProduct"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationImpurity" ADD CONSTRAINT "SpecificationImpurity_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "Specification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpecificationImpurity" ADD CONSTRAINT "SpecificationImpurity_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "Result"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReviewLog" ADD CONSTRAINT "ProjectReviewLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectReviewLog" ADD CONSTRAINT "ProjectReviewLog_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractProject" ADD CONSTRAINT "ContractProject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step1LiteratureStudy" ADD CONSTRAINT "Step1LiteratureStudy_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step1LiteratureStudy" ADD CONSTRAINT "Step1LiteratureStudy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step2FormulaBom" ADD CONSTRAINT "Step2FormulaBom_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step2FormulaBom" ADD CONSTRAINT "Step2FormulaBom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step3RawMaterialCoa" ADD CONSTRAINT "Step3RawMaterialCoa_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step3RawMaterialCoa" ADD CONSTRAINT "Step3RawMaterialCoa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step3std" ADD CONSTRAINT "Step3std_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step3std" ADD CONSTRAINT "Step3std_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step4PreFormulation" ADD CONSTRAINT "Step4PreFormulation_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step4PreFormulation" ADD CONSTRAINT "Step4PreFormulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step4PreFormulationPart" ADD CONSTRAINT "Step4PreFormulationPart_step4PreFormulationId_fkey" FOREIGN KEY ("step4PreFormulationId") REFERENCES "Step4PreFormulation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step4PreFormulationPart" ADD CONSTRAINT "Step4PreFormulationPart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step4Packaging" ADD CONSTRAINT "Step4Packaging_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step4Packaging" ADD CONSTRAINT "Step4Packaging_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step5AnalyticalDevlopRaw" ADD CONSTRAINT "Step5AnalyticalDevlopRaw_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step5AnalyticalDevlopRaw" ADD CONSTRAINT "Step5AnalyticalDevlopRaw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step5AnalyticalDevlopFinished" ADD CONSTRAINT "Step5AnalyticalDevlopFinished_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step5AnalyticalDevlopFinished" ADD CONSTRAINT "Step5AnalyticalDevlopFinished_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step6AnalyticalValidpRaw" ADD CONSTRAINT "Step6AnalyticalValidpRaw_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step6AnalyticalValidpRaw" ADD CONSTRAINT "Step6AnalyticalValidpRaw_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step6AnalyticalValidFinished" ADD CONSTRAINT "Step6AnalyticalValidFinished_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step6AnalyticalValidFinished" ADD CONSTRAINT "Step6AnalyticalValidFinished_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSpecification" ADD CONSTRAINT "ContractSpecification_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractSpecImpurity" ADD CONSTRAINT "ContractSpecImpurity_specificationId_fkey" FOREIGN KEY ("specificationId") REFERENCES "ContractSpecification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractBatch" ADD CONSTRAINT "ContractBatch_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractResult" ADD CONSTRAINT "ContractResult_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "ContractBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContractResultImpurity" ADD CONSTRAINT "ContractResultImpurity_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "ContractResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step8FormulationBOM" ADD CONSTRAINT "Step8FormulationBOM_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step8ManufacturingTank" ADD CONSTRAINT "Step8ManufacturingTank_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step9ScaleUpTrial" ADD CONSTRAINT "Step9ScaleUpTrial_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Step11CtdModule" ADD CONSTRAINT "Step11CtdModule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "ContractProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
