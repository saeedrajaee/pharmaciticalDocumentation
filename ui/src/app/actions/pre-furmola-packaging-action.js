"use server";

import { revalidatePath } from "next/cache";
import {
  createPackagingSchema,
  updatePackagingSchema,
} from "./validations/validation";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";

const API_BASE = BACKEND_URL;

function projectPackagingPath(projectId) {
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

function getPackagingValidationData(formData) {
  if (formData instanceof FormData) {
    const coaFile = formData.get("coaFile");
    const ursFile = formData.get("ursFile");

    return {
      packaagingName: formData.get("packaagingName")?.toString() || "",
      manufactor: formData.get("manufactor")?.toString() || undefined,
      coa: formData.get("coa")?.toString() || undefined,
      urs: formData.get("urs")?.toString() || undefined,
      coaFile: coaFile instanceof File && coaFile.size > 0 ? coaFile : undefined,
      ursFile: ursFile instanceof File && ursFile.size > 0 ? ursFile : undefined,
    };
  }

  return {
    packaagingName: formData?.packaagingName,
    manufactor: formData?.manufactor,
    coa: formData?.coa,
    urs: formData?.urs,
    coaFile: formData?.coaFile,
    ursFile: formData?.ursFile,
  };
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

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * ۱. ایجاد رکورد Packaging همراه فایل‌های COA/URS
 */
export async function createPackagingAction(projectId, formData) {
  if (!projectId) {
    return { success: false, message: "شناسه پروژه الزامی است" };
  }

  const validationData = getPackagingValidationData(formData);
  const validated = createPackagingSchema.safeParse(validationData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
      message: "لطفاً خطاهای فرم را برطرف کنید.",
    };
  }

  const body = new FormData();

  // فیلدهای متنی
  body.append("packaagingName", validated.data.packaagingName);
  if (validated.data.manufactor) {
    body.append("manufactor", validated.data.manufactor);
  }
  if (validated.data.coa) {
    body.append("coa", validated.data.coa);
  }
  if (validated.data.urs) {
    body.append("urs", validated.data.urs);
  }

  // فایل‌ها
  if (formData instanceof FormData) {
    const coaFile = formData.get("coaFile");
    const ursFile = formData.get("ursFile");

    if (coaFile instanceof File && coaFile.size > 0) {
      body.append("coaFile", coaFile);
    }
    if (ursFile instanceof File && ursFile.size > 0) {
      body.append("ursFile", ursFile);
    }
  }

  try {
    const response = await fetchApi(
      `${projectPackagingPath(projectId)}/packaging`,
      {
        method: "POST",
        body,
      },
    );

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ثبت پکیجینگ"),
        error: result,
      };
    }

    revalidatePath(projectPackagingPath(projectId));
    return {
      success: true,
      message: "پکیجینگ با موفقیت ثبت شد",
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
 * ۲. دریافت لیست Packaging
 */
export async function getPackagingListAction(projectId) {
  if (!projectId) return [];
  try {
    const response = await fetchApi(
      `${projectPackagingPath(projectId)}/packaging`,
    );
    const result = await readResponse(response);
    return response.ok && Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
}

/**
 * ۳. دریافت جزئیات یک Packaging
 */
export async function getPackagingByIdAction(projectId, id) {
  if (!projectId || !id) return null;
  try {
    const response = await fetchApi(
      `${projectPackagingPath(projectId)}/packaging/${id}`,
    );
    const result = await readResponse(response);
    return response.ok ? result : null;
  } catch {
    return null;
  }
}

/**
 * ۴. ویرایش Packaging (با امکان جایگزینی فایل‌های COA/URS)
 */
export async function updatePackagingAction(projectId, id, formData) {
  if (!projectId || !id) {
    return {
      success: false,
      message: "شناسه پروژه و رکورد پکیجینگ الزامی است",
    };
  }

  const validationData = getPackagingValidationData(formData);
  const validated = updatePackagingSchema.safeParse(validationData);

  if (!validated.success) {
    return {
      success: false,
      error: validated.error.flatten(),
      message: "لطفاً خطاهای فرم را برطرف کنید.",
    };
  }

  const body = new FormData();

  if (validated.data.packaagingName) {
    body.append("packaagingName", validated.data.packaagingName);
  }
  if (validated.data.manufactor) {
    body.append("manufactor", validated.data.manufactor);
  }
  if (validated.data.coa) {
    body.append("coa", validated.data.coa);
  }
  if (validated.data.urs) {
    body.append("urs", validated.data.urs);
  }

  if (formData instanceof FormData) {
    const coaFile = formData.get("coaFile");
    const ursFile = formData.get("ursFile");

    if (coaFile instanceof File && coaFile.size > 0) {
      body.append("coaFile", coaFile);
    }
    if (ursFile instanceof File && ursFile.size > 0) {
      body.append("ursFile", ursFile);
    }
  }

  try {
    const response = await fetchApi(
      `${projectPackagingPath(projectId)}/packaging/${id}`,
      {
        method: "PATCH",
        body,
      },
    );

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در ویرایش رکورد پکیجینگ"),
        error: result,
      };
    }

    revalidatePath(projectPackagingPath(projectId));
    return {
      success: true,
      message: "رکورد پکیجینگ با موفقیت ویرایش شد",
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
 * ۵. حذف Packaging
 */
export async function deletePackagingAction(projectId, id) {
  if (!projectId || !id) {
    return {
      success: false,
      message: "شناسه پروژه و رکورد پکیجینگ الزامی است",
    };
  }

  try {
    const response = await fetchApi(
      `${projectPackagingPath(projectId)}/packaging/${id}`,
      { method: "DELETE" },
    );

    const result = await readResponse(response);

    if (!response.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "خطا در حذف رکورد پکیجینگ"),
        error: result,
      };
    }

    revalidatePath(projectPackagingPath(projectId));
    return {
      success: true,
      message: "رکورد پکیجینگ با موفقیت حذف شد",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || "ارتباط با سرور برقرار نشد",
    };
  }
}
