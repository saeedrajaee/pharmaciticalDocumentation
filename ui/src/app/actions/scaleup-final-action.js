"use server";

import { revalidatePath } from "next/cache";
import {
  createStep7ScaleUpFinalSchema,
  updateStep7ScaleUpFinalSchema,
} from "./validations/validation";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";

const API_BASE = BACKEND_URL;

function projectPath(projectId) {
  return `/contract-projects/${projectId}`;
}

function scaleUpFinalPath(projectId) {
  return `${projectPath(projectId)}/scale-up-final`;
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

  return await fetch(url, { ...options, headers });
}

/**
 * استخراج داده‌ها از FormData جهت اعتبارسنجی
 */
function getScaleUpFinalValidationData(formData) {
  if (formData instanceof FormData) {
    const productionFile = formData.get(
      "productionTechnologyTransferDocumentFile"
    );
    const qcFile = formData.get("technologyTransferDocumentQCFile");

    return {
      productionTechnologyTransferDocumentFileUrl:
        formData
          .get("productionTechnologyTransferDocumentFileUrl")
          ?.toString() || undefined,

      technologyTransferDocumentQCFileUrl:
        formData.get("technologyTransferDocumentQCFileUrl")?.toString() ||
        undefined,

      productionTechnologyTransferDocumentFile:
        productionFile instanceof File && productionFile.size > 0
          ? productionFile
          : undefined,

      technologyTransferDocumentQCFile:
        qcFile instanceof File && qcFile.size > 0 ? qcFile : undefined,

      userId: formData.get("userId")?.toString() ?? "",
    };
  }

  return {
    productionTechnologyTransferDocumentFileUrl:
      formData?.productionTechnologyTransferDocumentFileUrl,
    technologyTransferDocumentQCFileUrl:
      formData?.technologyTransferDocumentQCFileUrl,
    productionTechnologyTransferDocumentFile:
      formData?.productionTechnologyTransferDocumentFile,
    technologyTransferDocumentQCFile: formData?.technologyTransferDocumentQCFile,
    userId: formData?.userId,
  };
}

/**
 * ۱) ایجاد Scale-Up Final (POST)
 */
export async function createStep7ScaleUpFinalAction(projectId, formData) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  const validationData = getScaleUpFinalValidationData(formData);
  const validated = createStep7ScaleUpFinalSchema.safeParse({
    productionTechnologyTransferDocumentFileUrl:
      validationData.productionTechnologyTransferDocumentFileUrl,
    technologyTransferDocumentQCFileUrl:
      validationData.technologyTransferDocumentQCFileUrl,
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

  // فیلدهای URL (اختیاری)
  if (validated.data.productionTechnologyTransferDocumentFileUrl) {
    body.append(
      "productionTechnologyTransferDocumentFileUrl",
      validated.data.productionTechnologyTransferDocumentFileUrl
    );
  }

  if (validated.data.technologyTransferDocumentQCFileUrl) {
    body.append(
      "technologyTransferDocumentQCFileUrl",
      validated.data.technologyTransferDocumentQCFileUrl
    );
  }

  if (validated.data.userId !== undefined && validated.data.userId !== "") {
    body.append("userId", String(validated.data.userId));
  }

  // فایل‌ها مطابق نام‌گذاری کنترلر NestJS
  const productionFile = formData.get(
    "productionTechnologyTransferDocumentFile"
  );
  if (productionFile instanceof File && productionFile.size > 0) {
    body.append("productionTechnologyTransferDocumentFile", productionFile);
  }

  const qcFile = formData.get("technologyTransferDocumentQCFile");
  if (qcFile instanceof File && qcFile.size > 0) {
    body.append("technologyTransferDocumentQCFile", qcFile);
  }

  try {
    const response = await fetchApi(scaleUpFinalPath(projectId), {
      method: "POST",
      body,
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ثبت Scale-Up Final"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "Scale-Up Final با موفقیت ثبت شد",
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
 * ۲) دریافت رکورد Scale-Up Final پروژه (GET)
 */
export async function getStep7ScaleUpFinalByProjectAction(projectId) {
  if (!projectId) return null;

  try {
    const response = await fetchApi(scaleUpFinalPath(projectId));
    const result = await readResponse(response);
    return response.ok ? result : null;
  } catch {
    return null;
  }
}

/**
 * ۳) ویرایش Scale-Up Final پروژه (PATCH) - بدون id
 */
export async function updateStep7ScaleUpFinalByProjectAction(projectId, formData) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  const validationData = getScaleUpFinalValidationData(formData);
  const validated = updateStep7ScaleUpFinalSchema.safeParse({
    productionTechnologyTransferDocumentFileUrl:
      validationData.productionTechnologyTransferDocumentFileUrl,
    technologyTransferDocumentQCFileUrl:
      validationData.technologyTransferDocumentQCFileUrl,
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

  if (validated.data.productionTechnologyTransferDocumentFileUrl) {
    body.append(
      "productionTechnologyTransferDocumentFileUrl",
      validated.data.productionTechnologyTransferDocumentFileUrl
    );
  }

  if (validated.data.technologyTransferDocumentQCFileUrl) {
    body.append(
      "technologyTransferDocumentQCFileUrl",
      validated.data.technologyTransferDocumentQCFileUrl
    );
  }

  if (validated.data.userId !== undefined && validated.data.userId !== "") {
    body.append("userId", String(validated.data.userId));
  }

  const productionFile = formData.get(
    "productionTechnologyTransferDocumentFile"
  );
  if (productionFile instanceof File && productionFile.size > 0) {
    body.append("productionTechnologyTransferDocumentFile", productionFile);
  }

  const qcFile = formData.get("technologyTransferDocumentQCFile");
  if (qcFile instanceof File && qcFile.size > 0) {
    body.append("technologyTransferDocumentQCFile", qcFile);
  }

  try {
    const response = await fetchApi(scaleUpFinalPath(projectId), {
      method: "PATCH",
      body,
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ویرایش Scale-Up Final"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "Scale-Up Final با موفقیت ویرایش شد",
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
 * ۴) حذف Scale-Up Final پروژه (DELETE) - بدون id
 */
export async function deleteStep7ScaleUpFinalByProjectAction(projectId) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  try {
    const response = await fetchApi(scaleUpFinalPath(projectId), {
      method: "DELETE",
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در حذف Scale-Up Final"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "Scale-Up Final با موفقیت حذف شد",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "ارتباط با سرور برقرار نشد",
    };
  }
}
