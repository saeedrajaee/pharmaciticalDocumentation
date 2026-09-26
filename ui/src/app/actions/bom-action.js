"use server";

import { revalidatePath } from "next/cache";
import {
  createStep2FormulaBomSchema,
  updateStep2FormulaBomSchema,
} from "./validations/validation";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";

const API_BASE = BACKEND_URL;

function projectBomPath(projectId) {
  return `/contract-projects/${projectId}`;
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

function getBomValidationData(formData) {
  if (formData instanceof FormData) {
    const file = formData.get("file");
    return {
      file: file instanceof File && file.size > 0 ? file : undefined,
      bomFileUrl: formData.get("bomFileUrl")?.toString() || undefined,
    };
  }
  return {
    file: formData?.file,
    bomFileUrl: formData?.bomFileUrl,
  };
}

/**
 * ارسال درخواست احراز هویت‌شده به NestJS
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();

  // بررسی همه مسیرهای ممکن برای توکن سشن
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

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * ۱. ایجاد رکورد BOM همراه فایل
 */
export async function createStep2FormulaBomAction(projectId, formData) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  const validationData = getBomValidationData(formData);
  const validated = createStep2FormulaBomSchema.safeParse(validationData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
      message: "لطفاً خطاهای فرم را برطرف کنید.",
    };
  }

  const body = new FormData();
  if (formData instanceof FormData) {
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      body.append("file", file);
    }
  }

  if (validated.data.bomFileUrl) {
    body.append("bomFileUrl", validated.data.bomFileUrl);
  }

  try {
    const response = await fetchApi(`${projectBomPath(projectId)}/bom`, {
      method: "POST",
      body,
    });

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ثبت فایل BOM"),
        error: result,
      };
    }

    revalidatePath(projectBomPath(projectId));
    return {
      success: true,
      message: "فایل BOM با موفقیت ثبت شد",
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
 * ۲. دریافت لیست BOM
 */
export async function getStep2FormulaBomListAction(projectId) {
  if (!projectId) return [];
  try {
    const response = await fetchApi(`${projectBomPath(projectId)}/bom`);
    const result = await readResponse(response);
    return response.ok && Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * ۳. دریافت جزئیات یک BOM
 */
export async function getStep2FormulaBomByIdAction(projectId, id) {
  if (!projectId || !id) return null;
  try {
    const response = await fetchApi(
      `${projectBomPath(projectId)}/bom/${id}`,
    );
    const result = await readResponse(response);
    return response.ok ? result : null;
  } catch {
    return null;
  }
}

/**
 * ۴. ویرایش BOM
 */
export async function updateStep2FormulaBomAction(projectId, id, formData) {
  if (!projectId || !id) {
    return {
      success: false,
      message: "شناسه پروژه و رکورد BOM الزامی است",
    };
  }

  const validationData = getBomValidationData(formData);
  const validated = updateStep2FormulaBomSchema.safeParse(validationData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
      message: "لطفاً خطاهای فرم را برطرف کنید.",
    };
  }

  const body = new FormData();
  if (formData instanceof FormData) {
    const file = formData.get("file");
    if (file instanceof File && file.size > 0) {
      body.append("file", file);
    }
  }

  if (validated.data.bomFileUrl) {
    body.append("bomFileUrl", validated.data.bomFileUrl);
  }

  try {
    const response = await fetchApi(
      `${projectBomPath(projectId)}/bom/${id}`,
      {
        method: "PATCH",
        body,
      },
    );

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ویرایش رکورد BOM"),
        error: result,
      };
    }

    revalidatePath(projectBomPath(projectId));
    return {
      success: true,
      message: "رکورد BOM با موفقیت ویرایش شد",
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
 * ۵. حذف BOM
 */
export async function deleteStep2FormulaBomAction(projectId, id) {
  if (!projectId || !id) {
    return {
      success: false,
      message: "شناسه پروژه و رکورد BOM الزامی است",
    };
  }

  try {
    const response = await fetchApi(
      `${projectBomPath(projectId)}/bom/${id}`,
      { method: "DELETE" },
    );
    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در حذف رکورد BOM"),
        error: result,
      };
    }

    revalidatePath(projectBomPath(projectId));
    return {
      success: true,
      message: "رکورد BOM با موفقیت حذف شد",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "ارتباط با سرور برقرار نشد",
    };
  }
}
