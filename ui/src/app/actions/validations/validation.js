import { z } from "zod";

// --- 1. Drug Product Schemas ---
export const drugProductSchema = z.object({
  finishedProductName: z.string().min(1, "نام محصول الزامی است"),
  api: z.string().min(1, "نام ماده موثره الزامی است"),
  dosageForm: z.enum(["Solution", "Solid", "Semisolid"], {
    errorMap: () => ({
      message: "شکل دارویی باید یکی از موارد Solution، Solid یا Semisolid باشد",
    }),
  }),
  strength: z.string().min(1, "غلظت الزامی است"),
  strengthUnit: z.string().min(1, "واحد غلظت الزامی است"),
  strongCondition: z.string().min(1, "شرایط نگهداری الزامی است"),
});

export const updateDrugProductSchema = drugProductSchema.partial();

// --- 2. Batch Schemas ---
export const batchSchema = z.object({
  batchDate: z.string().min(1, "تاریخ بچ الزامی است"),
  batchNumber: z.string().optional(),
  description: z.string().optional(),
  drugProductId: z.coerce.number().int().min(1, "شناسه محصول الزامی است"),
  userId: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
});

export const updateBatchSchema = batchSchema.partial();

// --- 3. Specification Schemas ---
export const specificationImpuritySchema = z.object({
  name: z.string().min(1, "نام ناخالصی الزامی است"),
  value: z.coerce.number().optional(),
  description: z.string().optional(),
});

export const specificationSchema = z.object({
  descriptionAppearance: z.string().optional(),
  identification1: z.string().optional(),
  identification2: z.string().optional(),
  assayMin: z.coerce.number().optional(),
  assayMax: z.coerce.number().optional(),
  pHMin: z.coerce.number().optional(),
  pHMax: z.coerce.number().optional(),
  clarity: z.string().optional(),
  particulatedMater25: z.coerce.number().optional(),
  particulatedMater10: z.coerce.number().optional(),
  sterility: z.string().optional(),
  leakTest: z.string().optional(),
  endotoxin: z.coerce.number().optional(),
  osmolarityMin: z.coerce.number().optional(),
  osmolarityMax: z.coerce.number().optional(),
  preservativeContent: z.coerce.number().optional(),
  uniformityOfDosage: z.string().optional(),
  drugProductId: z.coerce.number().int().min(1, "شناسه محصول الزامی است"),
  userId: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  impurities: z.array(specificationImpuritySchema).optional(),
});

export const updateSpecificationSchema = specificationSchema.partial();

// --- 4. Result Schemas ---
export const resultImpuritySchema = z.object({
  name: z.string().min(1, "نام ناخالصی الزامی است"),
  value: z.coerce.number().finite("مقدار ناخالصی باید یک عدد معتبر باشد"),
  description: z.string().min(1, "توضیح ناخالصی الزامی است"),
});

const ALLOWED_MONTHS = [0, 3, 6, 9, 12, 18, 24, 30, 36];

const parseBoolean = z.preprocess((val) => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (lower === "true" || lower === "1" || lower === "on") return true;
    if (lower === "false" || lower === "0" || lower === "off") return false;
  }
  if (typeof val === "number") {
    return val === 1;
  }
  return false;
}, z.boolean().optional());

export const resultSchema = z.object({
  accelrator: z.enum(["Accerator", "Long"]).optional(),
  month: z
    .coerce
    .number()
    .int()
    .refine((value) => ALLOWED_MONTHS.includes(value), {
      message: "ماه باید یکی از مقادیر مجاز باشد",
    })
    .optional(),
  appearance: parseBoolean,
  identification1: parseBoolean,
  identification2: parseBoolean,
  clarity: parseBoolean,
  leakTest: parseBoolean,
  sterility: parseBoolean,
  assay: z.coerce.number().finite("Assay باید عدد معتبر باشد").optional(),
  pH: z.coerce.number().finite("pH باید عدد معتبر باشد").optional(),
  particulatedMater25: z.coerce.number().finite("باید عدد معتبر باشد").optional(),
  particulatedMater10: z.coerce.number().finite("باید عدد معتبر باشد").optional(),
  endotoxin: z.coerce.number().finite("endotoxin باید عدد معتبر باشد").optional(),
  osmolarity: z.coerce.number().finite("osmolarity باید عدد معتبر باشد").optional(),
  preservativeContent: z.coerce.number().finite("باید عدد معتبر باشد").optional(),
  uniformityOfDosage: z.coerce
    .number()
    .finite("Uniformity Of Dosage باید عدد معتبر باشد")
    .max(15, "Uniformity Of Dosage باید حداکثر 15 باشد")
    .optional(),
  impurities: z.array(resultImpuritySchema).optional(),
  userId: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
  batchId: z.coerce.number().int().min(1, "انتخاب بچ الزامی است"),
});

export const updateResultSchema = resultSchema.partial();

export const drugProductWithBatchesSchema = drugProductSchema.extend({
  batches: z.array(batchSchema).optional(),
});

// --- 5. Contract Project Schemas ---
export const contractProjectSchema = z.object({
  projectCode: z.string().min(1, "کد پروژه الزامی است"),
  title: z.string().min(1, "عنوان پروژه الزامی است"),
  apiName: z.string().min(1, "نام ماده موثره الزامی است"),
  dosageForm: z.string().min(1, "شکل دارویی الزامی است"),
  strength: z.string().min(1, "دوز / غلظت الزامی است"),
  developerName: z.string().min(1, "نام توسعه‌دهنده الزامی است"),
  developerPhone: z
    .string()
    .min(1, "شماره تماس الزامی است")
    .regex(/^[0-9+\s-]{8,15}$/, "فرمت شماره تماس نامعتبر است"),
  userId: z.union([z.coerce.number().int().min(1), z.literal("")]).optional(),
});

export const updateContractProjectSchema = contractProjectSchema.partial();

export const createStudySchema = z.object({
  type: z.string().min(1, "نوع مطالعه الزامی است"),
  title: z.string().min(1, "عنوان مطالعه الزامی است"),
  reference: z.string().min(1, "مرجع/سورس الزامی است"),
  summary: z.string().optional().nullable(),
  fileUrl: z.string().optional().nullable(),
});

export const updateStudySchema = createStudySchema.partial();

// ==========================================
// 6. Raw Material COA (Step 3) Schemas
// ==========================================

// تبدیل سازگار FormData به Boolean بدون باگ
const transformToBoolean = (val) => {
  if (val === null || val === undefined || val === "") return undefined;
  if (typeof val === "boolean") return val;
  if (typeof val === "number") return val === 1;
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (lower === "true" || lower === "1" || lower === "on" || lower === "pass" || lower === "approved") return true;
    if (lower === "false" || lower === "0" || lower === "off" || lower === "fail" || lower === "rejected") return false;
  }
  return val;
};

export const parseBooleanRequired = z.preprocess(
  transformToBoolean,
  z.boolean({
    required_error: "نتیجه آنالیز الزامی است",
    invalid_type_error: "نتیجه آنالیز باید مقدار منطقی رد یا تائید باشد",
  })
);

export const parseBooleanOptionalWithDefault = z.preprocess(
  transformToBoolean,
  z.boolean().optional().default(true)
);

export const createRawMaterialCoaSchema = z.object({
  materialName: z.string().min(1, "نام ماده الزامی است"),
  manufacturer: z.string().min(1, "نام تولیدکننده الزامی است"),
  pharmaCopia: z.string().optional().nullable(),
  pharmaCopiaFileUrl: z.string().optional().nullable(),
  coaFileUrl: z.string().optional().nullable(),
  chekedByQC: parseBooleanOptionalWithDefault, // اصلاح شد تا اگر نبود خطا ندهد
});

export const updateRawMaterialCoaSchema = createRawMaterialCoaSchema
  .extend({
    chekedByQC: z.preprocess(
      transformToBoolean,
      z.boolean().optional(),
    ),
  })
  .partial();


// ==========================================
// 7. Finished Product COA (Step 3) Schemas
// ==========================================

export const createFinishedCoaSchema = z.object({
  stdName: z.string().min(1, "نام استاندارد الزامی است"),
  stdFileUrl: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  resultFormulationMaterials: parseBooleanRequired,
});

export const updateFinishedCoaSchema = createFinishedCoaSchema
  .extend({
    resultFormulationMaterials: z.preprocess(
      transformToBoolean,
      z.boolean().optional()
    ),
  })
  .partial();

export const createStep2FormulaBomSchema = z.object({
  bomFileUrl: z
    .string({ message: "آدرس فایل باید متنی باشد" })
    .optional(),
});

export const updateStep2FormulaBomSchema =
  createStep2FormulaBomSchema.partial();

  // ==========================================
// 8. Pre-Formulation (Step 4) Schemas
// ==========================================

export const createPreFormulationPartSchema = z.object({
  componentsName: z.string().optional().nullable(),
  componentsAmount: z.coerce.number().optional().nullable(),
  componentsRole: z.string().optional().nullable(),
  manufacturingProcess: z.string().optional().nullable(),
});

export const createPreFormulationSchema = z.object({
  formul: z.string().min(1, "فیلد فرمول الزامی است"),
  description: z.string().optional().nullable(),
  parts: z.array(createPreFormulationPartSchema).optional().default([]),
});

export const updatePreFormulationSchema = createPreFormulationSchema.partial();
// ==========================================
// 9. Packaging (Step 4) Schemas
// مطابق DTO: CreatePackagingDto / UpdatePackagingDto
// ==========================================
export const createPackagingSchema = z.object({
  packaagingName: z.string().min(1, "نام پکیجینگ الزامی است"),
  manufactor: z.string().optional(),
  coa: z.string().optional(),
  urs: z.string().optional(),
});

export const updatePackagingSchema = createPackagingSchema.partial();
// ==========================================
// 10. Analytical Develop Raw (Step 5) Schemas
// ==========================================

export const createAnalyticalDevlopRawSchema = z.object({
  name: z.string().min(1, "نام ماده الزامی است"),
  manufactor: z.string().optional(),
  specFileUrl: z.string().optional().nullable(),
  moaFileUrl: z.string().optional().nullable(),
  dmfFileUrl: z.string().optional().nullable(),
});

export const updateAnalyticalDevlopRawSchema =
  createAnalyticalDevlopRawSchema.partial();
// ==========================================
// 11. Analytical Develop Finished (Step 5) Schemas
// مطابق DTO: CreateStep5AnalyticalDevlopFinishedDto / UpdateStep5AnalyticalDevlopFinishedDto
// ==========================================

export const createAnalyticalDevlopFinishedSchema = z.object({
  pharmacopia: z.string().min(1, "انتخاب یا ورود فارماکوپه الزامی است"),

  pharmacopiaFileUrl: z.string().optional().nullable(),
  specFileUrl: z.string().optional().nullable(),
  moaFileUrl: z.string().optional().nullable(),
});

export const updateAnalyticalDevlopFinishedSchema =
  createAnalyticalDevlopFinishedSchema.partial();


export const parseBooleanOptionalWithDefaultTrue = z.preprocess(
  transformToBoolean,
  z.boolean().optional().default(true),
);

// ==========================================
// 12. Analytical Valid Raw (Step 6) Schemas
// مطابق Prisma:
// pharmacopia Boolean @default(true)
// assayFileUrl String?
// impurityFileUrl String?
// ==========================================

export const createAnalyticalValidRawSchema = z.object({
  pharmacopia: parseBooleanOptionalWithDefaultTrue,
  assayFileUrl: z.string().optional().nullable(),
  impurityFileUrl: z.string().optional().nullable(),
});

export const updateAnalyticalValidRawSchema =
  createAnalyticalValidRawSchema.partial();


  const optionalFileUrlSchema = z
  .string({ invalid_type_error: "آدرس فایل باید متن باشد" })
  .trim()
  .nullable()
  .optional();

/**
 * ۱) اسکیمای ایجاد رکورد Step6 Analytical Valid Finished
 */
const booleanPreprocessor = (val) => {
  if (typeof val === "boolean") return val;
  if (typeof val === "string") {
    const normalized = val.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no"].includes(normalized)) return false;
  }
  if (typeof val === "number") {
    if (val === 1) return true;
    if (val === 0) return false;
  }
  return val;
};

/**
 * Schema برای ایجاد رکورد Step 6 Finished
 */
export const createAnalyticalValidFinishedSchema = z.object({
  pharmacopia: z
    .preprocess(
      booleanPreprocessor,
      z.boolean({
        invalid_type_error: "نوع باید به درستی انتخاب شود (Verification یا Validation)",
      })
    )
    .optional(),

  assayFileUrl: z.string().trim().nullable().optional(),
  impurityFileUrl: z.string().trim().nullable().optional(),
});

/**
 * Schema برای ویرایش رکورد Step 6 Finished
 */
export const updateAnalyticalValidFinishedSchema =
  createAnalyticalValidFinishedSchema.partial();

  // ==========================================
// 13. Formulation Development (Step 7) Schemas
// مطابق CreateStep7FormulationDevelopmentDto
// ==========================================

const optionalStep7StringSchema = z
  .string({ invalid_type_error: "مقدار باید متنی باشد" })
  .trim()
  .nullable()
  .optional();

const optionalStep7DateSchema = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }

    return value;
  },
  z.coerce.date({
    invalid_type_error: "فرمت تاریخ نامعتبر است",
  }).optional(),
);

export const createStep7FormulationDevelopmentSchema = z.object({
  furmol: optionalStep7StringSchema,
  date: optionalStep7DateSchema,
  manufacturingMethod: optionalStep7StringSchema,
  packaging: optionalStep7StringSchema,
});

export const updateStep7FormulationDevelopmentSchema =
  createStep7FormulationDevelopmentSchema.partial();
