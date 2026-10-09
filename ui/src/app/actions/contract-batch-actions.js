"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createContractBatchSchema,
  updateContractBatchSchema,
  createContractBatchResultSchema,
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
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function prepareJsonRequestBody(payload, schema, isUpdate = false) {
  const validationData = payload || {};
  
  // در صورتی که اسکیما تعریف شده باشد اعتبارسنجی انجام می‌شود
  if (schema && typeof schema.safeParse === "function") {
    const validated = schema.safeParse(validationData);

    if (!validated.success) {
      return {
        error: true,
        message: isUpdate
          ? "خطا در اعتبارسنجی مقادیر ویرایش"
          : "خطا در اعتبارسنجی داده‌های ورودی",
        details: validated.error.flatten().fieldErrors,
      };
    }

    const cleanData = { ...validated.data };
    if (cleanData.userId === "" || cleanData.userId === null) {
      delete cleanData.userId;
    }

    return {
      body: JSON.stringify(cleanData),
      validationData: cleanData,
    };
  }

  return {
    body: JSON.stringify(validationData),
    validationData,
  };
}

// متد کمکی برای پاک‌سازی کش صفحات مربوط به پروژه
function revalidateBatchPaths(projectId, batchId = null) {
  if (!projectId) return;

  revalidatePath(`/contract-projects/${projectId}`);
  revalidatePath(`/contract-projects/${projectId}/contract-batches`);
  revalidatePath(`/contract-projects/${projectId}/batches`);
  revalidatePath(`/contract-projects/${projectId}/stability`);

  if (batchId) {
    revalidatePath(`/contract-projects/${projectId}/contract-batches/${batchId}`);
  }
}

/* =========================================================================
   BATCH ACTIONS
   ========================================================================= */

/**
 * ایجاد بچ قراردادی / پایداری جدید
 */
export async function createContractBatchAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  const prepared = prepareJsonRequestBody(
    payload,
    createContractBatchSchema,
    false
  );
  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/contract-batches`,
      {
        method: "POST",
        body: prepared.body,
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در ثبت بچ قراردادی",
        details: data?.errors,
      };
    }

    revalidateBatchPaths(projectId, data?.id);

    return { success: true, data };
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطای ارتباط با سرور",
    };
  }
}

/**
 * دریافت لیست تمامی بچ‌های یک پروژه (امکان فیلتر بر اساس stage)
 */
export async function getContractBatchesByProjectIdAction(projectId, stage = null) {
  if (!projectId) return null;

  try {
    const query = stage ? `?stage=${encodeURIComponent(stage)}` : "";
    const response = await fetchApi(
      `/contract-projects/${projectId}/contract-batches${query}`,
      {
        method: "GET",
      }
    );

    const data = await parseResponse(response);
    if (!response.ok) return null;

    return data;
  } catch (error) {
    console.error("Error fetching contract batches:", error);
    return null;
  }
}

/**
 * دریافت اطلاعات یک بچ مشخص
 */
export async function getContractBatchByIdAction(projectId, id) {
  if (!projectId || !id) return null;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/contract-batches/${id}`,
      {
        method: "GET",
      }
    );

    const data = await parseResponse(response);
    if (!response.ok) return null;

    return data;
  } catch (error) {
    console.error("Error fetching contract batch:", error);
    return null;
  }
}

/**
 * ویرایش اطلاعات بچ
 */
export async function updateContractBatchAction(projectId, id, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }
  if (!id) {
    return { error: true, message: "شناسه بچ الزامی است" };
  }

  const prepared = prepareJsonRequestBody(
    payload,
    updateContractBatchSchema,
    true
  );
  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/contract-batches/${id}`,
      {
        method: "PATCH",
        body: prepared.body,
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در به‌روزرسانی بچ قراردادی",
        details: data?.errors,
      };
    }

    revalidateBatchPaths(projectId, id);

    return { success: true, data };
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطای سرور در به‌روزرسانی",
    };
  }
}

/**
 * حذف بچ
 */
export async function deleteContractBatchAction(projectId, id) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }
  if (!id) {
    return { error: true, message: "شناسه بچ الزامی است" };
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/contract-batches/${id}`,
      {
        method: "DELETE",
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در حذف بچ قراردادی",
        details: data?.errors,
      };
    }

    revalidateBatchPaths(projectId, id);

    return { success: true, data };
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطای سرور در حذف رکورد",
    };
  }
}

/* =========================================================================
   BATCH RESULTS ACTIONS (نتایج پایداری / تست)
   ========================================================================= */

/**
 * دریافت لیست نتایج ثبت‌شده برای یک بچ مشخص
 */
export async function getContractBatchResultsAction(batchId) {
  if (!batchId) return [];

  try {
    const response = await fetchApi(
      `/contract-batches/${batchId}/results`,
      {
        method: "GET",
      }
    );

    const data = await parseResponse(response);
    if (!response.ok) return [];

    return Array.isArray(data) ? data : data?.data || data?.results || [];
  } catch (error) {
    console.error("Error fetching batch results:", error);
    return [];
  }
}

/**
 * ایجاد یک نتیجه تست / پایداری جدید برای یک بچ
 */
export async function createContractBatchResultAction(batchId, payload) {
  if (!batchId) {
    return { error: true, message: "شناسه بچ الزامی است" };
  }

  const prepared = prepareJsonRequestBody(
    payload,
    createContractBatchResultSchema,
    false
  );
  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-batches/${batchId}/results`,
      {
        method: "POST",
        body: prepared.body,
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در ثبت نتیجه بچ",
        details: data?.errors,
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطای ارتباط با سرور هنگام ثبت نتیجه",
    };
  }
}

/**
 * حذف یک نتیجه تست / پایداری
 */
export async function deleteContractBatchResultAction(batchId, resultId) {
  if (!batchId || !resultId) {
    return { error: true, message: "شناسه بچ و شناسه نتیجه الزامی است" };
  }

  try {
    const response = await fetchApi(
      `/contract-batches/${batchId}/results/${resultId}`,
      {
        method: "DELETE",
      }
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در حذف نتیجه بچ",
        details: data?.errors,
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطای سرور در حذف نتیجه",
    };
  }
}
