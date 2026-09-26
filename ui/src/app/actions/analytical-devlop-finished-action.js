"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createAnalyticalDevlopFinishedSchema,
  updateAnalyticalDevlopFinishedSchema,
} from "./validations/validation";

const API_BASE = BACKEND_URL;

/**
 * ارسال درخواست به بک‌اند با پشتیبانی از JSON و FormData
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();

  const token =
    session?.accessToken ||
    session?.token ||
    session?.user?.accessToken ||
    session?.user?.token ||
    null;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // برای FormData نباید Content-Type را دستی تنظیم کنیم؛
  // مرورگر boundary مناسب را اضافه می‌کند.
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}

/**
 * خواندن امن پاسخ JSON
 */
async function parseResponse(response) {
  return response.json().catch(() => ({}));
}

/**
 * استخراج داده قابل اعتبارسنجی از FormData
 * - فقط فیلدهای متنی را برای Zod برمی‌داریم
 * - فایل‌ها (pharmacopiaFile/specFile/moaFile) در validation دخالت ندارند
 */
function getFinishedFormDataValidationData(formData) {
  const data = {};

  const fields = [
    "pharmacopia",
    "pharmacopiaFileUrl",
    "specFileUrl",
    "moaFileUrl",
  ];

  for (const field of fields) {
    if (!formData.has(field)) continue;

    const value = formData.get(field);

    // pharmacopia اجباری است؛ اگر "" باشد باید همان "" بماند تا Zod خطا بدهد
    if (field === "pharmacopia") {
      data[field] = value;
      continue;
    }

    // بقیه فیلدها optional هستند:
    // - اگر "" بود => undefined (ارسال نشود)
    // - اگر "null" (string) بود => null (برای optional().nullable())
    if (value === "" || value === undefined) {
      data[field] = undefined;
    } else if (value === "null") {
      data[field] = null;
    } else {
      data[field] = value;
    }
  }

  return data;
}

/**
 * اعتبارسنجی و ساخت بدنه درخواست (JSON یا FormData)
 */
function prepareFinishedRequestBody(payload, schema, isUpdate = false) {
  let body;
  let validationData;

  if (payload instanceof FormData) {
    body = payload;
    validationData = getFinishedFormDataValidationData(payload);
  } else {
    validationData = payload || {};
    body = JSON.stringify(validationData);
  }

  const validated = schema.safeParse(validationData);

  if (!validated.success) {
    return {
      error: true,
      message: isUpdate
        ? "خطا در اعتبارسنجی مقادیر ویرایش"
        : "خطا در اعتبارسنجی داده‌ها",
      details: validated.error.flatten().fieldErrors,
    };
  }

  return {
    body,
    validationData: validated.data,
  };
}

/**
 * ۱) ایجاد رکورد Analytical Develop Finished (Project-based)
 * POST /contract-projects/:projectId/analytical-devlop-finished
 * - اگر فایل دارید: payload باید FormData باشد و کلید فایل‌ها دقیقاً:
 *   pharmacopiaFile, specFile, moaFile
 */
export async function createAnalyticalDevlopFinishedAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  const prepared = prepareFinishedRequestBody(
    payload,
    createAnalyticalDevlopFinishedSchema,
    false
  );

  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-finished`,
      {
        method: "POST",
        body: prepared.body,
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message:
          data?.message || "خطا در ثبت رکورد Analytical Develop Finished",
        details: data?.errors,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(
      `/contract-projects/${projectId}/analytical-devlop-finished`
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in createAnalyticalDevlopFinishedAction:",
      error
    );

    return { error: true, message: "خطا در برقراری ارتباط با سرور" };
  }
}

/**
 * ۲) دریافت رکورد Finished یک پروژه (Project-based)
 * GET /contract-projects/:projectId/analytical-devlop-finished
 */
export async function getAnalyticalDevlopFinishedAction(projectId) {
  if (!projectId) return null;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-finished`,
      { method: "GET" }
    );

    if (!response.ok) {
      const data = await parseResponse(response);

      console.error(
        `Fetch Error for project ${projectId} (Finished):`,
        data?.message || "خطا در دریافت رکورد"
      );

      return null;
    }

    return await parseResponse(response);
  } catch (error) {
    console.error("Fetch Error in getAnalyticalDevlopFinishedAction:", error);
    return null;
  }
}

/**
 * ۳) ویرایش رکورد Finished یک پروژه (Project-based)
 * PATCH /contract-projects/:projectId/analytical-devlop-finished
 * - امکان جایگزینی فایل‌ها با FormData:
 *   pharmacopiaFile, specFile, moaFile
 */
export async function updateAnalyticalDevlopFinishedAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  const prepared = prepareFinishedRequestBody(
    payload,
    updateAnalyticalDevlopFinishedSchema,
    true
  );

  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-finished`,
      {
        method: "PATCH",
        body: prepared.body,
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در به‌روزرسانی رکورد",
        details: data?.errors,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(
      `/contract-projects/${projectId}/analytical-devlop-finished`
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in updateAnalyticalDevlopFinishedAction:",
      error
    );

    return {
      error: true,
      message: error?.message || "خطا در ارتباط با سرور",
    };
  }
}

/**
 * ۴) حذف رکورد Finished یک پروژه (Project-based)
 * DELETE /contract-projects/:projectId/analytical-devlop-finished
 */
export async function deleteAnalyticalDevlopFinishedAction(projectId) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-finished`,
      { method: "DELETE" }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در حذف رکورد",
        details: data?.errors,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(
      `/contract-projects/${projectId}/analytical-devlop-finished`
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in deleteAnalyticalDevlopFinishedAction:",
      error
    );

    return {
      error: true,
      message: error?.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}
