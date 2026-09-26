import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

// ==========================================
// DTOهای اصلی پروژه
// ==========================================

export class CreateContractProjectDto {
  @IsString()
  @IsNotEmpty({ message: 'کد پروژه الزامی است' })
  projectCode: string;

  @IsString()
  @IsNotEmpty({ message: 'عنوان پروژه الزامی است' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: 'نام ماده موثره (API) الزامی است' })
  apiName: string;

  @IsString()
  @IsNotEmpty({ message: 'شکل دارویی الزامی است' })
  dosageForm: string;

  @IsString()
  @IsNotEmpty({ message: 'دوز/قدرت دارویی الزامی است' })
  strength: string;

  @IsString()
  @IsNotEmpty({ message: 'نام توسعه‌دهنده الزامی است' })
  developerName: string;

  @IsString()
  @IsNotEmpty({ message: 'شماره تماس توسعه‌دهنده الزامی است' })
  developerPhone: string;
  
  @IsString()
  @IsOptional()
  step?: string;
  
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    userId?: number;
}

// // DTO جدید برای به‌روزرسانی پروژه و تغییر مالکیت
// export class UpdateContractProjectDto {
//   @IsString()
//   @IsOptional()
//   projectCode?: string;

//   @IsString()
//   @IsOptional()
//   title?: string;

//   @IsString()
//   @IsOptional()
//   apiName?: string;

//   @IsString()
//   @IsOptional()
//   dosageForm?: string;

//   @IsString()
//   @IsOptional()
//   strength?: string;

//   @IsString()
//   @IsOptional()
//   developerName?: string;

//   @IsString()
//   @IsOptional()
//   developerPhone?: string;

//   @IsNumber()
//   @IsOptional()
//   userId?: number; // فیلد اضافه شده برای انتقال مالکیت (فقط توسط ادمین)
// }

// export class ReviewProjectDto {
//   @IsEnum(ProjectStep, { message: 'گام انتخاب شده معتبر نیست' })
//   @IsNotEmpty()
//   step: ProjectStep;

//   @IsEnum(ReviewAction, { message: 'نوع عملیات بررسی معتبر نیست' })
//   @IsNotEmpty()
//   action: ReviewAction;

//   @IsString()
//   @IsOptional()
//   comment?: string;
// }

// // ==========================================
// // DTOهای گام‌های ۱۱گانه
// // ==========================================

// export class Step1LiteratureStudyDto {
//   @IsString()
//   @IsNotEmpty({ message: 'عنوان مطالعه الزامی است' })
//   title: string;

//   @IsString()
//   @IsNotEmpty({ message: 'مرجع/سورس الزامی است' })
//   reference: string;

//   @IsString()
//   @IsOptional()
//   summary?: string;
// }

// export class Step2FormulaBomDto {
//   @IsString()
//   @IsNotEmpty({ message: 'نام ماده الزامی است' })
//   material: string;

//   @IsString()
//   @IsNotEmpty({ message: 'نقش ماده در فرمولاسیون الزامی است' })
//   role: string;

//   @IsNumber({}, { message: 'درصد باید یک عدد معتبر باشد' })
//   @Type(() => Number)
//   percentage: number;

//   @IsString()
//   @IsOptional()
//   standard?: string;
// }

// export class Step3RawMaterialCoaDto {
//   @IsString()
//   @IsNotEmpty({ message: 'نام ماده اولیه الزامی است' })
//   materialName: string;

//   @IsString()
//   @IsNotEmpty({ message: 'نام سازنده الزامی است' })
//   manufacturer: string;

//   @IsString()
//   @IsNotEmpty({ message: 'شماره بچ الزامی است' })
//   batchNumber: string;

//   @IsDateString({}, { message: 'تاریخ انقضا باید فرمت تاریخ معتبر داشته باشد' })
//   @IsOptional()
//   expiryDate?: string;
// }

// export class Step3FinishedCoaDto {
//   @IsString()
//   @IsNotEmpty({ message: 'کد فرمولاسیون الزامی است' })
//   formulationCode: string;

//   @IsDateString({}, { message: 'تاریخ آزمایش معتبر نیست' })
//   @IsNotEmpty()
//   testDate: string;

//   @IsString()
//   @IsOptional()
//   description?: string;
// }

// export class Step4LabTrialDto {
//   @IsString()
//   @IsNotEmpty({ message: 'شماره تکرار آزمایشگاهی الزامی است' })
//   trialNumber: string;

//   @IsDateString({}, { message: 'تاریخ آزمایش معتبر نیست' })
//   @IsNotEmpty()
//   trialDate: string;

//   @IsString()
//   @IsOptional()
//   resultSummary?: string;
// }

// export class Step5MoaDocDto {
//   @IsString()
//   @IsNotEmpty({ message: 'نوع مستند الزامی است' })
//   docType: string;

//   @IsString()
//   @IsNotEmpty({ message: 'عنوان سند الزامی است' })
//   title: string;

//   @IsString()
//   @IsOptional()
//   version?: string;
// }

// export class ContractSpecImpurityDto {
//   @IsString()
//   @IsNotEmpty({ message: 'نام ناخالصی الزامی است' })
//   name: string;

//   @IsNumber({}, { message: 'حد مجاز ناخالصی باید عدد باشد' })
//   @Type(() => Number)
//   limit: number;

//   @IsString()
//   @IsOptional()
//   description?: string;
// }

// export class ContractSpecificationDto {
//   @IsEnum(StabilityStage)
//   @IsOptional()
//   stage?: StabilityStage;

//   @IsString()
//   @IsOptional()
//   descriptionAppearance?: string;

//   @IsString()
//   @IsOptional()
//   identification1?: string;

//   @IsString()
//   @IsOptional()
//   identification2?: string;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   assayMin?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   assayMax?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   pHMin?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   pHMax?: number;

//   @IsString()
//   @IsOptional()
//   clarity?: string;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   particulatedMater25?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   particulatedMater10?: number;

//   @IsString()
//   @IsOptional()
//   sterility?: string;

//   @IsString()
//   @IsOptional()
//   leakTest?: string;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   endotoxin?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   osmolarityMin?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   osmolarityMax?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   preservativeContent?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   uniformityOfDosage?: number;

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => ContractSpecImpurityDto)
//   @IsOptional()
//   impurities?: ContractSpecImpurityDto[];
// }

// export class ContractBatchDto {
//   @IsEnum(StabilityStage)
//   @IsOptional()
//   stage?: StabilityStage;

//   @IsString()
//   @IsNotEmpty({ message: 'شماره بچ الزامی است' })
//   batchNumber: string;

//   @IsDateString({}, { message: 'تاریخ تولید بچ معتبر نیست' })
//   @IsNotEmpty()
//   batchDate: string;

//   @IsString()
//   @IsOptional()
//   description?: string;
// }

// export class ContractResultImpurityDto {
//   @IsString()
//   @IsNotEmpty({ message: 'نام ناخالصی الزامی است' })
//   name: string;

//   @IsNumber()
//   @Type(() => Number)
//   value: number;
// }

// export class ContractResultDto {
//   @IsEnum(StabilityCondition)
//   @IsNotEmpty()
//   condition: StabilityCondition;

//   @IsNumber()
//   @Type(() => Number)
//   month: number;

//   @IsBoolean()
//   @IsOptional()
//   appearance?: boolean;

//   @IsBoolean()
//   @IsOptional()
//   identification1?: boolean;

//   @IsBoolean()
//   @IsOptional()
//   identification2?: boolean;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   assay?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   pH?: number;

//   @IsBoolean()
//   @IsOptional()
//   clarity?: boolean;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   particulatedMater25?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   particulatedMater10?: number;

//   @IsBoolean()
//   @IsOptional()
//   leakTest?: boolean;

//   @IsBoolean()
//   @IsOptional()
//   sterility?: boolean;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   endotoxin?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   osmolarity?: number;

//   @IsNumber()
//   @IsOptional()
//   @Type(() => Number)
//   uniformityOfDosage?: number;

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => ContractResultImpurityDto)
//   @IsOptional()
//   impurities?: ContractResultImpurityDto[];
// }

// export class Step8FormulationBOMDto {
//   @IsString()
//   @IsNotEmpty({ message: 'نام ماده الزامی است' })
//   materialName: string;

//   @IsString()
//   @IsNotEmpty({ message: 'گرید استاندارد الزامی است' })
//   standardGrade: string;

//   @IsNumber()
//   @Type(() => Number)
//   unitFormula: number;

//   @IsString()
//   @IsNotEmpty({ message: 'واحد فرمولاسیون الزامی است' })
//   unit: string;

//   @IsNumber()
//   @Type(() => Number)
//   batchQuantity: number;

//   @IsString()
//   @IsNotEmpty({ message: 'واحد بچ الزامی است' })
//   batchUnit: string;
// }

// export class Step8ManufacturingTankDto {
//   @IsString()
//   @IsNotEmpty({ message: 'تگ تانک الزامی است' })
//   tankTag: string;

//   @IsNumber()
//   @Type(() => Number)
//   tankCapacity: number;

//   @IsString()
//   @IsNotEmpty({ message: 'جنس تانک الزامی است' })
//   tankMaterial: string;

//   @IsString()
//   @IsOptional()
//   filterSpecs?: string;
// }

// export class Step9ScaleUpTrialDto {
//   @IsString()
//   @IsNotEmpty({ message: 'شماره بچ اسکیل‌آپ الزامی است' })
//   batchNumber: string;

//   @IsDateString({}, { message: 'تاریخ تولید اسکیل‌آپ معتبر نیست' })
//   @IsNotEmpty()
//   scaleUpDate: string;

//   @IsNumber()
//   @Type(() => Number)
//   batchSize: number;

//   @IsString()
//   @IsOptional()
//   observations?: string;
// }

// export class Step11CtdModuleDto {
//   @IsString()
//   @IsNotEmpty({ message: 'سکشن ماژول CTD الزامی است' })
//   moduleSection: string;

//   @IsString()
//   @IsNotEmpty({ message: 'عنوان بخش پرونده CTD الزامی است' })
//   sectionTitle: string;

//   @IsString()
//   @IsOptional()
//   version?: string;

// }
