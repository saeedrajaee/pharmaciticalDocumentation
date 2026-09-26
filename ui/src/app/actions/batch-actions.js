"use server";

import { revalidatePath } from "next/cache";
import { batchSchema, updateBatchSchema } from "./validations/validation";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";

const API_BASE = BACKEND_URL;

/**
 * درخواست احراز هویت‌شده به NestJS.
 * هنگام ارسال FormData نباید Content-Type را دستی تنظیم کرد.
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();
  const token = session?.accessToken;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const isFormData = options.body instanceof FormData;

  console.log("--- BATCH API DEBUG START ---");
  console.log("Endpoint:", endpoint);
  console.log("Method:", options.method || "GET");
  console.log("Token Found:", !!token);
  console.log("Body Type:", isFormData ? "FormData" : typeof options.body);
  console.log("--- BATCH API DEBUG END ---");

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });
}

/**
 * بدنه پاسخ را بدون ایجاد خطا برای پاسخ‌های خالی یا غیر JSON می‌خواند.
 */
async function readResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

function getErrorMessage(result, fallbackMessage) {
  if (Array.isArray(result?.message)) {
    return result.message.join(", ");
  }

  return result?.message || fallbackMessage;
}

function getBatchValidationData(formData) {
  const batchDateRaw = formData.get("batchDate");
  // تبدیل تاریخ به ISO String برای اطمینان از صحت فرمت
  const batchDate = batchDateRaw
    ? new Date(batchDateRaw).toISOString()
    : undefined;

  return {
    batchDate,
    batchNumber: formData.get("batchNumber") || undefined,
    description: formData.get("description") || undefined,
    userId: formData.get("userId") || undefined,
    drugProductId: formData.get("drugProductId") || undefined,
  };
}

export async function createBatchAction(formData) {
  const data = getBatchValidationData(formData);
  const validated = batchSchema.safeParse(data);

  if (!validated.success) {
    console.error("Zod Error:", validated.error.flatten()); // برای دیباگ
    return {
      success: false,
      error: validated.error.flatten(),
      message: "Please fix the form errors.",
    };
  }

  try {
    const res = await fetchApi("/batch", {
      method: "POST",
      // نکته مهم: ارسال به صورت JSON تا NestJS و class-validator بتوانند آن را بخوانند
      body: JSON.stringify(validated.data),
    });

    const result = await readResponse(res);

    if (!res.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "Error creating batch"),
      };
    }

    revalidatePath("/home/batches");
    return {
      success: true,
      message: "Batch created successfully",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to connect to server",
    };
  }
}

export async function updateBatchAction(id, formData) {
  if (!id) return { success: false, message: "Batch ID is required" };

  const data = getBatchValidationData(formData);

  const updateData = Object.fromEntries(
    Object.entries(data).filter(
      ([, value]) => value !== null && value !== undefined && value !== "",
    ),
  );

  const validated = updateBatchSchema.safeParse(updateData);

  if (!validated.success) {
    console.error("Zod Error:", validated.error.flatten());
    return {
      success: false,
      error: validated.error.flatten(),
      message: "Please fix the form errors.",
    };
  }

  try {
    const res = await fetchApi(`/batch/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validated.data), // ارسال به صورت JSON
    });

    const result = await readResponse(res);
    if (!res.ok)
      return {
        success: false,
        message: getErrorMessage(result, "Error updating batch"),
      };

    revalidatePath("/home/batches");
    return {
      success: true,
      message: "Batch updated successfully",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || "Failed to connect to server",
    };
  }
}

export async function deleteBatchAction(id) {
  if (!id) {
    return {
      success: false,
      message: "Batch ID is required",
    };
  }

  try {
    const res = await fetchApi(`/batch/${id}`, {
      method: "DELETE",
    });

    const result = await readResponse(res);

    if (!res.ok) {
      return {
        success: false,
        message: getErrorMessage(result, "Error deleting batch"),
      };
    }

    revalidatePath("/home/batches");

    return {
      success: true,
      message: "Batch deleted successfully",
      data: result,
    };
  } catch (error) {
    console.error(`Error in deleteBatchAction (ID: ${id}):`, error);

    return {
      success: false,
      message: error.message || "Failed to connect to server",
    };
  }
}

export async function getBatchAction() {
  try {
    const res = await fetchApi("/batch");
    const result = await readResponse(res);

    if (!res.ok) {
      console.error(
        "Fetch Error in getBatchAction:",
        getErrorMessage(result, "Failed to fetch batches"),
      );

      return [];
    }

    return Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("General Fetch Error in getBatchAction:", error);
    return [];
  }
}

export async function getBatchByIdAction(id) {
  if (!id) {
    return null;
  }

  try {
    const res = await fetchApi(`/batch/${id}`);
    const result = await readResponse(res);

    if (!res.ok) {
      console.error(
        `Fetch Error in getBatchByIdAction (ID: ${id}):`,
        getErrorMessage(result, "Failed to fetch batch"),
      );

      return null;
    }

    return result;
  } catch (error) {
    console.error(
      `General Fetch Error in getBatchByIdAction (ID: ${id}):`,
      error,
    );

    return null;
  }
}
