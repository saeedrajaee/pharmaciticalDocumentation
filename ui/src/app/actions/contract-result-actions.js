"use server";

import { revalidatePath } from "next/cache";
import {
  createContractBatchResultSchema,
  updateContractBatchResultSchema,
} from "./validations/validation";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";

const API_BASE = BACKEND_URL;

async function fetchApi(endpoint, options = {}) {
  const session = await getSession();

  // خواندن امن توکن از تمام ساختارهای محتمل سشن
  const token =
    session?.accessToken ||
    session?.token ||
    session?.user?.accessToken ||
    session?.user?.token ||
    null;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

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
 * ایجاد نتیجه پایداری جدید برای بچ قراردادی
 */
export async function createContractResultAction(payload) {
  const validated = createContractBatchResultSchema.safeParse(payload);

  if (!validated.success) {
    return {
      error: true,
      validationErrors: validated.error.flatten(),
      message: "اطلاعات ارسالی نامعتبر است",
    };
  }

  try {
    const res = await fetchApi("/contract-result", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });

    const data = await parseResponse(res);

    if (!res.ok) {
      return {
        error: true,
        message: data?.message || "خطا در ثبت نتیجه پایداری",
        details: data?.errors,
      };
    }

    revalidatePath("/contract-projects");
    if (validated.data?.batchId) {
      revalidatePath(`/contract-projects/${validated.data.batchId}`);
    }
    return data;
  } catch (error) {
    console.error("Connection Error in createContractResultAction:", error);
    return {
      error: true,
      message: error?.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}

/**
 * دریافت لیست نتایج پایداری
 */
export async function getContractResultsAction(batchId) {
  try {
    const endpoint = batchId
      ? `/contract-result?batchId=${batchId}`
      : "/contract-result";

    const res = await fetchApi(endpoint, { method: "GET" });
    const data = await parseResponse(res);

    if (!res.ok) {
      console.error("Fetch Error in getContractResultsAction:", data?.message);
      return [];
    }

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch Error in getContractResultsAction:", error);
    return [];
  }
}

/**
 * دریافت یک نتیجه مشخص با ID
 */
export async function getContractResultByIdAction(id) {
  if (!id) return null;

  try {
    const res = await fetchApi(`/contract-result/${id}`, { method: "GET" });
    const data = await parseResponse(res);

    if (!res.ok) {
      console.error(`Fetch Error for ID ${id}:`, data?.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("General Fetch Error in getContractResultByIdAction:", error);
    return null;
  }
}

/**
 * ویرایش نتیجه پایداری
 */
export async function updateContractResultAction(id, payload) {
  if (!id) {
    return { error: true, message: "شناسه نتیجه الزامی است" };
  }

  const validated = updateContractBatchResultSchema.safeParse(payload);

  if (!validated.success) {
    return {
      error: true,
      validationErrors: validated.error.flatten(),
      message: "اطلاعات ارسالی نامعتبر است",
    };
  }

  try {
    const res = await fetchApi(`/contract-result/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validated.data),
    });

    const data = await parseResponse(res);

    if (!res.ok) {
      return {
        error: true,
        message: data?.message || "خطا در ویرایش نتیجه پایداری",
        details: data?.errors,
      };
    }

    revalidatePath("/contract-projects");
    return data;
  } catch (error) {
    console.error("Connection Error in updateContractResultAction:", error);
    return {
      error: true,
      message: error?.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}

/**
 * حذف نتیجه پایداری
 */
export async function deleteContractResultAction(id) {
  if (!id) {
    return { error: true, message: "شناسه نتیجه الزامی است" };
  }

  try {
    const res = await fetchApi(`/contract-result/${id}`, {
      method: "DELETE",
    });

    const data = await parseResponse(res);

    if (!res.ok) {
      return {
        error: true,
        message: data?.message || "خطا در حذف نتیجه پایداری",
      };
    }

    revalidatePath("/contract-projects");
    return data;
  } catch (error) {
    console.error("Connection Error in deleteContractResultAction:", error);
    return {
      error: true,
      message: error?.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}
