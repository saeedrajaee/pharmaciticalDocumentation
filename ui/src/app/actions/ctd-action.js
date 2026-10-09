"use server";

import { revalidatePath } from "next/cache";
import {
  createStep8CtdModuleSchema,
  updateStep8CtdModuleSchema,
} from "./validations/validation";

import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";

const API_BASE = BACKEND_URL;

function projectPath(projectId) {
  return `/contract-projects/${projectId}`;
}

function ctdPath(projectId) {
  return `${projectPath(projectId)}/ctd`;
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
 * استخراج داده‌ها از FormData یا Object
 * - فایل‌ها: ctdFile, fdaApprovalLetterFile
 * - فیلدها: ctdFileUrl, fdaApproval, fdaApprovalLetterNumber, fdaApprovalLetterFileUrl, userId
 */
function getCtdValidationData(input) {
  // ورودی FormData (در Server Action)
  if (input instanceof FormData) {
    const ctdFile = input.get("ctdFile");
    const fdaApprovalLetterFile = input.get("fdaApprovalLetterFile");

    return {
      // فایل‌ها را داخل schema اعتبارسنجی نمی‌کنیم، ولی برای تصمیم‌گیری در اکشن نگه می‌داریم
      ctdFile: ctdFile instanceof File && ctdFile.size > 0 ? ctdFile : undefined,
      fdaApprovalLetterFile:
        fdaApprovalLetterFile instanceof File && fdaApprovalLetterFile.size > 0
          ? fdaApprovalLetterFile
          : undefined,

      ctdFileUrl: input.get("ctdFileUrl")?.toString() || undefined,
      fdaApproval: input.get("fdaApproval")?.toString() ?? undefined,
      fdaApprovalLetterNumber:
        input.get("fdaApprovalLetterNumber")?.toString() || undefined,
      fdaApprovalLetterFileUrl:
        input.get("fdaApprovalLetterFileUrl")?.toString() || undefined,
      userId: input.get("userId")?.toString() ?? undefined,
    };
  }

  // ورودی Object
  return {
    ctdFile: input?.ctdFile,
    fdaApprovalLetterFile: input?.fdaApprovalLetterFile,

    ctdFileUrl: input?.ctdFileUrl,
    fdaApproval: input?.fdaApproval,
    fdaApprovalLetterNumber: input?.fdaApprovalLetterNumber,
    fdaApprovalLetterFileUrl: input?.fdaApprovalLetterFileUrl,
    userId: input?.userId,
  };
}

/**
 * ارسال درخواست احراز هویت‌شده به NestJS
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();

  const token = session?.accessToken || session?.token || session?.user?.token || null;
  if (!token) throw new Error("Unauthorized");

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${token}`);

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  return await fetch(url, { ...options, headers });
}

/**
 * ۱) ایجاد رکورد CTD برای پروژه (POST /contract-projects/:projectId/ctd)
 * - فایل‌ها: ctdFile, fdaApprovalLetterFile
 * - فیلدها: مطابق Zod
 */
export async function createStep8CtdModuleAction(projectId, formData) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  const extracted = getCtdValidationData(formData);

  // اعتبارسنجی دقیق طبق schema جدید شما
  const validated = createStep8CtdModuleSchema.safeParse({
    ctdFileUrl: extracted.ctdFileUrl,
    fdaApproval: extracted.fdaApproval,
    fdaApprovalLetterNumber: extracted.fdaApprovalLetterNumber,
    fdaApprovalLetterFileUrl: extracted.fdaApprovalLetterFileUrl,
    userId: extracted.userId,
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
      message: "لطفاً خطاهای فرم را برطرف کنید.",
    };
  }

  // ساخت FormData نهایی برای NestJS
  const body = new FormData();

  // فایل‌ها (نام‌ها باید دقیقاً با کنترلر یکی باشند)
  if (extracted.ctdFile instanceof File && extracted.ctdFile.size > 0) {
    body.append("ctdFile", extracted.ctdFile);
  }
  if (
    extracted.fdaApprovalLetterFile instanceof File &&
    extracted.fdaApprovalLetterFile.size > 0
  ) {
    body.append("fdaApprovalLetterFile", extracted.fdaApprovalLetterFile);
  }

  // فیلدهای متنی/تاریخی
  // نکته: zod تاریخ را Date می‌کند؛ ولی FormData باید string بگیرد.
  if (validated.data.ctdFileUrl) body.append("ctdFileUrl", validated.data.ctdFileUrl);

  if (validated.data.fdaApproval instanceof Date) {
    body.append("fdaApproval", validated.data.fdaApproval.toISOString());
  }

  if (validated.data.fdaApprovalLetterNumber) {
    body.append("fdaApprovalLetterNumber", validated.data.fdaApprovalLetterNumber);
  }

  if (validated.data.fdaApprovalLetterFileUrl) {
    body.append("fdaApprovalLetterFileUrl", validated.data.fdaApprovalLetterFileUrl);
  }

  // userId طبق schema: یا عدد، یا "" (که باید ارسال نشود یا ارسال خالی باشد)
  if (validated.data.userId !== undefined && validated.data.userId !== "") {
    body.append("userId", String(validated.data.userId));
  }

  try {
    const response = await fetchApi(ctdPath(projectId), {
      method: "POST",
      body,
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ثبت پرونده CTD"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "پرونده CTD با موفقیت ثبت شد",
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
 * ۲) دریافت رکورد CTD پروژه (GET /contract-projects/:projectId/ctd)
 */
export async function getStep8CtdModuleByProjectAction(projectId) {
  if (!projectId) return null;

  try {
    const response = await fetchApi(ctdPath(projectId), { method: "GET" });
    const result = await readResponse(response);
    return response.ok ? result : null;
  } catch {
    return null;
  }
}

/**
 * ۳) ویرایش رکورد CTD پروژه (PATCH /contract-projects/:projectId/ctd)
 */
export async function updateStep8CtdModuleByProjectAction(projectId, formData) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  const extracted = getCtdValidationData(formData);

  const validated = updateStep8CtdModuleSchema.safeParse({
    ctdFileUrl: extracted.ctdFileUrl,
    fdaApproval: extracted.fdaApproval,
    fdaApprovalLetterNumber: extracted.fdaApprovalLetterNumber,
    fdaApprovalLetterFileUrl: extracted.fdaApprovalLetterFileUrl,
    userId: extracted.userId,
  });

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
      message: "لطفاً خطاهای فرم را برطرف کنید.",
    };
  }

  const body = new FormData();

  // فایل‌ها (اختیاری)
  if (extracted.ctdFile instanceof File && extracted.ctdFile.size > 0) {
    body.append("ctdFile", extracted.ctdFile);
  }
  if (
    extracted.fdaApprovalLetterFile instanceof File &&
    extracted.fdaApprovalLetterFile.size > 0
  ) {
    body.append("fdaApprovalLetterFile", extracted.fdaApprovalLetterFile);
  }

  // فیلدها (partial)
  if (validated.data.ctdFileUrl !== undefined && validated.data.ctdFileUrl !== null) {
    body.append("ctdFileUrl", validated.data.ctdFileUrl);
  }

  if (validated.data.fdaApproval !== undefined) {
    // اگر undefined شده یعنی کاربر خالی فرستاده یا اصلاً نفرستاده؛
    // در صورت ارسال واقعی Date تبدیل به ISO
    if (validated.data.fdaApproval instanceof Date) {
      body.append("fdaApproval", validated.data.fdaApproval.toISOString());
    }
    // اگر می‌خواهید "پاک کردن تاریخ" را هم پشتیبانی کنید باید قرارداد بک‌اند مشخص باشد؛
    // فعلاً چیزی append نمی‌کنیم.
  }

  if (
    validated.data.fdaApprovalLetterNumber !== undefined &&
    validated.data.fdaApprovalLetterNumber !== null
  ) {
    body.append("fdaApprovalLetterNumber", validated.data.fdaApprovalLetterNumber);
  }

  if (
    validated.data.fdaApprovalLetterFileUrl !== undefined &&
    validated.data.fdaApprovalLetterFileUrl !== null
  ) {
    body.append("fdaApprovalLetterFileUrl", validated.data.fdaApprovalLetterFileUrl);
  }

  if (validated.data.userId !== undefined && validated.data.userId !== "") {
    body.append("userId", String(validated.data.userId));
  }

  try {
    const response = await fetchApi(ctdPath(projectId), {
      method: "PATCH",
      body,
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ویرایش پرونده CTD"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "پرونده CTD با موفقیت ویرایش شد",
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
 * ۴) حذف رکورد CTD پروژه (DELETE /contract-projects/:projectId/ctd)
 */
export async function deleteStep8CtdModuleByProjectAction(projectId) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  try {
    const response = await fetchApi(ctdPath(projectId), { method: "DELETE" });
    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در حذف پرونده CTD"),
        error: result,
      };
    }

    revalidatePath(projectPath(projectId));
    return {
      success: true,
      message: "پرونده CTD با موفقیت حذف شد",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "ارتباط با سرور برقرار نشد",
    };
  }
}
