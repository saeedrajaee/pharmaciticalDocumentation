"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createAnalyticalValidRawSchema,
  updateAnalyticalValidRawSchema,
} from "./validations/validation";

const API_BASE = BACKEND_URL;

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

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });
}

async function parseResponse(response) {
  return response.json().catch(() => ({}));
}

/**
 * داده‌هایی که باید با Zod چک شوند را از FormData استخراج می‌کند
 * (فایل‌ها را وارد validation نمی‌کنیم)
 */
function getFormDataValidationData(formData) {
  const data = {};
  const fields = ["pharmacopia", "assayFileUrl", "impurityFileUrl"];

  for (const field of fields) {
    if (formData.has(field)) {
      const value = formData.get(field);
      // برای boolean و رشته‌ها: اگر خالی بود undefined
      data[field] = value === "" ? undefined : value ?? undefined;
    }
  }

  return data;
}

function prepareRequestBody(payload, schema, isUpdate = false) {
  let body;
  let validationData;

  if (payload instanceof FormData) {
    body = payload;
    validationData = getFormDataValidationData(payload);
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

  return { body, validationData: validated.data };
}

// 1) Create
export async function createAnalyticalValidRawAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  const prepared = prepareRequestBody(payload, createAnalyticalValidRawSchema);

  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-raw`,
      { method: "POST", body: prepared.body },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در ثبت رکورد Analytical Valid Raw",
        details: data?.errors,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/analytical-valid-raw`);

    return data;
  } catch (error) {
    console.error("Connection Error in createAnalyticalValidRawAction:", error);
    return { error: true, message: "خطا در برقراری ارتباط با سرور" };
  }
}

// 2) List
export async function getAnalyticalValidRawListAction(projectId) {
  if (!projectId) return [];

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-raw`,
      { method: "GET" },
    );

    if (!response.ok) {
      const data = await parseResponse(response);
      console.error(
        `Fetch Error for project ${projectId}:`,
        data?.message || "خطا در دریافت رکوردها",
      );
      return [];
    }

    return await parseResponse(response);
  } catch (error) {
    console.error("Fetch Error in getAnalyticalValidRawListAction:", error);
    return [];
  }
}

// 3) Get by id
export async function getAnalyticalValidRawByIdAction(projectId, rawId) {
  if (!projectId || !rawId) return null;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-raw/${rawId}`,
      { method: "GET" },
    );

    if (!response.ok) {
      const data = await parseResponse(response);
      console.error(
        `Fetch Error in getAnalyticalValidRawByIdAction (ID: ${rawId}):`,
        data?.message || "رکورد مورد نظر یافت نشد",
      );
      return null;
    }

    return await parseResponse(response);
  } catch (error) {
    console.error("General Fetch Error in getAnalyticalValidRawByIdAction:", error);
    return null;
  }
}

// 4) Update
export async function updateAnalyticalValidRawAction(projectId, rawId, payload) {
  if (!projectId || !rawId) {
    return { error: true, message: "شناسه پروژه و رکورد الزامی است" };
  }

  const prepared = prepareRequestBody(
    payload,
    updateAnalyticalValidRawSchema,
    true,
  );

  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-raw/${rawId}`,
      { method: "PATCH", body: prepared.body },
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
    revalidatePath(`/contract-projects/${projectId}/analytical-valid-raw`);
    revalidatePath(`/contract-projects/${projectId}/analytical-valid-raw/${rawId}`);

    return data;
  } catch (error) {
    console.error("Connection Error in updateAnalyticalValidRawAction:", error);
    return { error: true, message: error?.message || "خطا در ارتباط با سرور" };
  }
}

// 5) Delete
export async function deleteAnalyticalValidRawAction(projectId, rawId) {
  if (!projectId || !rawId) {
    return { error: true, message: "شناسه پروژه و رکورد الزامی است" };
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-valid-raw/${rawId}`,
      { method: "DELETE" },
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
    revalidatePath(`/contract-projects/${projectId}/analytical-valid-raw`);

    return data;
  } catch (error) {
    console.error("Connection Error in deleteAnalyticalValidRawAction:", error);
    return { error: true, message: error?.message || "خطا در برقراری ارتباط با سرور" };
  }
}
