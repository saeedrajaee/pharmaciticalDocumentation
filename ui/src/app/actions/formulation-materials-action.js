"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createFinishedCoaSchema,
  updateFinishedCoaSchema,
} from "./validations/validation";

const API_BASE = BACKEND_URL;

/**
 * ارسال درخواست به بک‌اند با توکن نشست کاربر
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();

  const token =
    session?.accessToken ||
    session?.token ||
    session?.user?.token ||
    null;

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // برای FormData، Content-Type دستی تنظیم نمی‌شود تا هدر boundary توسط fetch ست شود.
  if (
    !(options.body instanceof FormData) &&
    options.body != null &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}

/**
 * تبدیل هوشمند payload به داده قابل اعتبارسنجی توسط Zod
 */
function getValidationData(payload) {
  if (payload instanceof FormData) {
    const data = {};

    for (const [key, value] of payload.entries()) {
      // فایل‌های باینری را به Zod نمی‌دهیم
      if (value instanceof File) continue;

      // رشته‌های خالی به undefined تبدیل می‌شوند
      data[key] = value === "" ? undefined : value;
    }

    // نگاشت کمکی: اگر در فرم نام اینپوت formulationCode بود، به stdName تبدیل شود
    if (!data.stdName && data.formulationCode) {
      data.stdName = data.formulationCode;
      payload.set("stdName", data.formulationCode);
    }

    return data;
  }

  const raw = { ...(payload ?? {}) };
  if (!raw.stdName && raw.formulationCode) {
    raw.stdName = raw.formulationCode;
  }
  return raw;
}

/**
 * خواندن پاسخ سرور به صورت ایمن
 */
async function readResponseBody(response) {
  return response.json().catch(() => ({}));
}

/**
 * ۱. ایجاد رکورد Finished COA (Step3std)
 */
export async function createFinishedCoaAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  const validationData = getValidationData(payload);
  const validated = createFinishedCoaSchema.safeParse(validationData);

  if (!validated.success) {
    const details = validated.error.flatten().fieldErrors;
    const firstError =
      Object.values(details).flat()[0] || "خطا در اعتبارسنجی داده‌ها";

    return {
      error: true,
      message: firstError,
      details,
    };
  }

  // اگر FormData بود خود آن وگرنه خروجی اعتبارسنجی‌شده ارسال می‌شود
  const body =
    payload instanceof FormData ? payload : JSON.stringify(validated.data);

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/finished-coa`,
      {
        method: "POST",
        body,
      },
    );

    const data = await readResponseBody(response);

    if (!response.ok) {
      return {
        error: true,
        message:
          data?.message || "خطا در ثبت رکورد COA محصول نهایی",
        details: data,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/finished-coa`);

    return data;
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}

/**
 * ۲. دریافت لیست رکوردهای Finished COA یک پروژه
 */
export async function getFinishedCoaListAction(projectId) {
  if (!projectId) return [];

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/finished-coa`,
    );

    if (!response.ok) return [];

    return await response.json();
  } catch {
    return [];
  }
}

/**
 * ۳. دریافت جزئیات یک رکورد Finished COA
 */
export async function getFinishedCoaByIdAction(projectId, coaId) {
  if (!projectId || !coaId) return null;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/finished-coa/${coaId}`,
    );

    if (!response.ok) return null;

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * ۴. ویرایش رکورد Finished COA
 */
export async function updateFinishedCoaAction(projectId, coaId, payload) {
  if (!projectId || !coaId) {
    return {
      error: true,
      message: "شناسه پروژه و رکورد COA الزامی است",
    };
  }

  const validationData = getValidationData(payload);
  const validated = updateFinishedCoaSchema.safeParse(validationData);

  if (!validated.success) {
    const details = validated.error.flatten().fieldErrors;
    const firstError =
      Object.values(details).flat()[0] ||
      "خطا در اعتبارسنجی مقادیر ویرایش";

    return {
      error: true,
      message: firstError,
      details,
    };
  }

  const body =
    payload instanceof FormData ? payload : JSON.stringify(validated.data);

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/finished-coa/${coaId}`,
      {
        method: "PATCH",
        body,
      },
    );

    const data = await readResponseBody(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در به‌روزرسانی رکورد COA",
        details: data,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/finished-coa`);
    revalidatePath(
      `/contract-projects/${projectId}/finished-coa/${coaId}`,
    );

    return data;
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطا در ارتباط با سرور",
    };
  }
}

/**
 * ۵. حذف یک رکورد Finished COA
 */
export async function deleteFinishedCoaAction(projectId, coaId) {
  if (!projectId || !coaId) {
    return {
      error: true,
      message: "شناسه پروژه و رکورد COA الزامی است",
    };
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/finished-coa/${coaId}`,
      {
        method: "DELETE",
      },
    );

    const data = await readResponseBody(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در حذف رکورد COA",
        details: data,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/finished-coa`);

    return data;
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطا در ارتباط با سرور",
    };
  }
}
