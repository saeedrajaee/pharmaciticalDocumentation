"use server";

import { revalidatePath } from "next/cache";
import {
  createStep6ScaleUpTrialSchema,
  updateStep6ScaleUpTrialSchema,
} from "./validations/validation";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";

const API_BASE = BACKEND_URL;

function projectPath(projectId) {
  return `/contract-projects/${projectId}`;
}

function scaleUpTrialPath(projectId) {
  return `${projectPath(projectId)}/scale-up-trial`;
}

async function readResponse(response) {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  return await response.text();
}

function getErrorMessage(result, defaultMessage = "خطایی رخ داده است") {
  if (!result) return defaultMessage;
  if (typeof result === "string") return result;
  if (Array.isArray(result.message)) return result.message.join(" - ");
  if (typeof result.message === "string") return result.message;
  if (typeof result.error === "string") return result.error;
  return defaultMessage;
}

/**
 * ارسال درخواست احراز هویت‌شده به NestJS
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();

  const token =
    session?.accessToken ||
    session?.token ||
    session?.user?.token ||
    null;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  return fetch(url, { ...options, headers });
}

/**
 * استخراج داده‌ها از FormData جهت اعتبارسنجی
 */
function getScaleUpTrialValidationData(formData) {
  if (formData instanceof FormData) {
    const reportFile = formData.get("reportFile");
    const manufacturingProcessFile = formData.get("manufacturingProcessFile");

    return {
      batchNumber: formData.get("batchNumber")?.toString() || "",
      scaleUpManufacturingProcess:
        formData.get("scaleUpManufacturingProcess")?.toString() || "",
      reportFile:
        reportFile instanceof File && reportFile.size > 0 ? reportFile : undefined,
      manufacturingProcessFile:
        manufacturingProcessFile instanceof File && manufacturingProcessFile.size > 0
          ? manufacturingProcessFile
          : undefined,
      userId: formData.get("userId")?.toString() ?? "",
    };
  }

  return {
    batchNumber: formData?.batchNumber,
    scaleUpManufacturingProcess: formData?.scaleUpManufacturingProcess,
    reportFile: formData?.reportFile,
    manufacturingProcessFile: formData?.manufacturingProcessFile,
    userId: formData?.userId,
  };
}

/**
 * ۱) ایجاد Trial
 */
export async function createStep6ScaleUpTrialAction(projectId, formData) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  const validationData = getScaleUpTrialValidationData(formData);
  const validated = createStep6ScaleUpTrialSchema.safeParse({
    batchNumber: validationData.batchNumber,
    scaleUpManufacturingProcess: validationData.scaleUpManufacturingProcess,
    userId: validationData.userId,
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
      message: "لطفاً خطاهای فرم را برطرف کنید.",
    };
  }

  const body = new FormData();

  // فیلدهای متنی
  body.append("batchNumber", validated.data.batchNumber);
  body.append("scaleUpManufacturingProcess", validated.data.scaleUpManufacturingProcess);

  if (validated.data.userId !== undefined && validated.data.userId !== "") {
    body.append("userId", String(validated.data.userId));
  }

  // فایل‌ها مطابق نام‌گذاری کنترلر NestJS
  const reportFile = formData.get("reportFile");
  if (reportFile instanceof File && reportFile.size > 0) {
    body.append("reportFile", reportFile);
  }

  const manufacturingProcessFile = formData.get("manufacturingProcessFile");
  if (manufacturingProcessFile instanceof File && manufacturingProcessFile.size > 0) {
    body.append("manufacturingProcessFile", manufacturingProcessFile);
  }

  try {
    const response = await fetchApi(scaleUpTrialPath(projectId), {
      method: "POST",
      body,
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ثبت Scale-up Trial"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "Scale-up Trial با موفقیت ثبت شد",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "ارتباط با سرور برقرار نشد",
    };
  }
}

/**
 * ۲) دریافت لیست Trialها
 */
export async function getStep6ScaleUpTrialListAction(projectId) {
  if (!projectId) return [];
  try {
    const response = await fetchApi(scaleUpTrialPath(projectId));
    const result = await readResponse(response);
    return response.ok && Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * ۳) ویرایش Trial
 */
export async function updateStep6ScaleUpTrialAction(projectId, id, formData) {
  if (!projectId || !id) {
    return {
      success: false,
      message: "شناسه پروژه و رکورد Trial الزامی است",
    };
  }

  const validationData = getScaleUpTrialValidationData(formData);
  const validated = updateStep6ScaleUpTrialSchema.safeParse({
    batchNumber: validationData.batchNumber || undefined,
    scaleUpManufacturingProcess: validationData.scaleUpManufacturingProcess || undefined,
    userId: validationData.userId,
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
      message: "لطفاً خطاهای فرم را برطرف کنید.",
    };
  }

  const body = new FormData();

  if (validated.data.batchNumber) {
    body.append("batchNumber", validated.data.batchNumber);
  }
  if (validated.data.scaleUpManufacturingProcess) {
    body.append("scaleUpManufacturingProcess", validated.data.scaleUpManufacturingProcess);
  }
  if (validated.data.userId !== undefined && validated.data.userId !== "") {
    body.append("userId", String(validated.data.userId));
  }

  const reportFile = formData.get("reportFile");
  if (reportFile instanceof File && reportFile.size > 0) {
    body.append("reportFile", reportFile);
  }

  const manufacturingProcessFile = formData.get("manufacturingProcessFile");
  if (manufacturingProcessFile instanceof File && manufacturingProcessFile.size > 0) {
    body.append("manufacturingProcessFile", manufacturingProcessFile);
  }

  try {
    const response = await fetchApi(`${scaleUpTrialPath(projectId)}/${id}`, {
      method: "PATCH",
      body,
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ویرایش Scale-up Trial"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "Scale-up Trial با موفقیت ویرایش شد",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "ارتباط با سرور برقرار نشد",
    };
  }
}

/**
 * ۴) حذف Trial
 */
export async function deleteStep6ScaleUpTrialAction(projectId, id) {
  if (!projectId || !id) {
    return {
      success: false,
      message: "شناسه پروژه و رکورد Trial الزامی است",
    };
  }

  try {
    const response = await fetchApi(`${scaleUpTrialPath(projectId)}/${id}`, {
      method: "DELETE",
    });
    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در حذف Scale-up Trial"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "Scale-up Trial با موفقیت حذف شد",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "ارتباط با سرور برقرار نشد",
    };
  }
}
