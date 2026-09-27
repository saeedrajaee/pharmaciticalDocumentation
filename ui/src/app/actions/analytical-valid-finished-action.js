"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createAnalyticalValidFinishedSchema,
  updateAnalyticalValidFinishedSchema,
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

  // برای FormData نباید Content-Type را دستی ست کنیم تا boundary خودکار ست شود
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
 * استخراج داده‌های متنی قابل اعتبارسنجی از FormData
 * فایل‌های خام (assayFile / impurityFile) در validation Zod دخالت داده نمی‌شوند
 */
function getFinishedFormDataValidationData(formData) {
  const data = {};
  const fields = ["pharmacopia", "assayFileUrl", "impurityFileUrl"];

  for (const field of fields) {
    if (!formData.has(field)) continue;

    const value = formData.get(field);

    if (field === "pharmacopia") {
      data[field] = value;
      continue;
    }

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
 * اعتبارسنجی داده‌ها و آماده‌سازی بدنه درخواست
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
 * ۱) ایجاد رکورد Step6 Analytical Valid Finished
 * POST /contract-projects/:projectId/analytical-valid-finished
 * فایل‌های مجاز در FormData: assayFile, impurityFile
 */
export async function createAnalyticalValidFinishedAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  const prepared = prepareFinishedRequestBody(
    payload,
    createAnalyticalValidFinishedSchema,
    false
  );

  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-finished`,
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
          data?.message || "خطا در ثبت رکورد Analytical Valid Finished",
        details: data?.errors,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(
      `/contract-projects/${projectId}/analytical-valid-finished`
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in createAnalyticalValidFinishedAction:",
      error
    );
    return { error: true, message: "خطا در برقراری ارتباط با سرور" };
  }
}

/**
 * ۲) دریافت رکورد Step6 Analytical Valid Finished
 * GET /contract-projects/:projectId/analytical-valid-finished
 */
export async function getAnalyticalValidFinishedAction(projectId) {
  if (!projectId) return null;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-finished`,
      { method: "GET" }
    );

    if (!response.ok) {
      const data = await parseResponse(response);
      console.error(
        `Fetch Error for project ${projectId} (Valid Finished):`,
        data?.message || "خطا در دریافت رکورد"
      );
      return null;
    }

    return await parseResponse(response);
  } catch (error) {
    console.error("Fetch Error in getAnalyticalValidFinishedAction:", error);
    return null;
  }
}

/**
 * ۳) ویرایش رکورد Step6 Analytical Valid Finished
 * PATCH /contract-projects/:projectId/analytical-valid-finished
 * فایل‌های مجاز در FormData: assayFile, impurityFile
 */
export async function updateAnalyticalValidFinishedAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  const prepared = prepareFinishedRequestBody(
    payload,
    updateAnalyticalValidFinishedSchema,
    true
  );

  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-finished`,
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
      `/contract-projects/${projectId}/analytical-valid-finished`
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in updateAnalyticalValidFinishedAction:",
      error
    );
    return {
      error: true,
      message: error?.message || "خطا در ارتباط با سرور",
    };
  }
}

/**
 * ۴) حذف رکورد Step6 Analytical Valid Finished
 * DELETE /contract-projects/:projectId/analytical-valid-finished
 */
export async function deleteAnalyticalValidFinishedAction(projectId) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-finished`,
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
      `/contract-projects/${projectId}/analytical-valid-finished`
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in deleteAnalyticalValidFinishedAction:",
      error
    );
    return {
      error: true,
      message: "خطا در برقراری ارتباط با سرور",
    };
  }
}
