"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createAnalyticalDevlopRawSchema,
  updateAnalyticalDevlopRawSchema,
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
 */
function getFormDataValidationData(formData, isUpdate = false) {
  const data = {};

  const fields = [
    "name",
    "manufactor",
    "specFileUrl",
    "moaFileUrl",
    "dmfFileUrl",
  ];

  for (const field of fields) {
    if (formData.has(field)) {
      const value = formData.get(field);

      if (field === "name" && value === "") {
        data[field] = value;
      } else {
        data[field] = value || undefined;
      }
    }
  }

  return data;
}

/**
 * اعتبارسنجی و ساخت بدنه درخواست
 */
function prepareRequestBody(payload, schema, isUpdate = false) {
  let body;
  let validationData;

  if (payload instanceof FormData) {
    body = payload;
    validationData = getFormDataValidationData(payload, isUpdate);
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
 * ۱. ایجاد رکورد Analytical Develop Raw
 */
export async function createAnalyticalDevlopRawAction(projectId, payload) {
  if (!projectId) {
    return {
      error: true,
      message: "شناسه پروژه الزامی است",
    };
  }

  const prepared = prepareRequestBody(
    payload,
    createAnalyticalDevlopRawSchema,
  );

  if (prepared.error) {
    return prepared;
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-raw`,
      {
        method: "POST",
        body: prepared.body,
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message:
          data?.message || "خطا در ثبت رکورد Analytical Develop Raw",
        details: data?.errors,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(
      `/contract-projects/${projectId}/analytical-devlop-raw`,
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in createAnalyticalDevlopRawAction:",
      error,
    );

    return {
      error: true,
      message: "خطا در برقراری ارتباط با سرور",
    };
  }
}

/**
 * ۲. دریافت لیست تمام رکوردهای Analytical Develop Raw یک پروژه
 */
export async function getAnalyticalDevlopRawListAction(projectId) {
  if (!projectId) {
    return [];
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-raw`,
      {
        method: "GET",
      },
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
    console.error(
      "Fetch Error in getAnalyticalDevlopRawListAction:",
      error,
    );

    return [];
  }
}

/**
 * ۳. دریافت جزئیات یک رکورد Analytical Develop Raw
 */
export async function getAnalyticalDevlopRawByIdAction(
  projectId,
  rawId,
) {
  if (!projectId || !rawId) {
    return null;
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-raw/${rawId}`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      const data = await parseResponse(response);

      console.error(
        `Fetch Error in getAnalyticalDevlopRawByIdAction (ID: ${rawId}):`,
        data?.message || "رکورد مورد نظر یافت نشد",
      );

      return null;
    }

    return await parseResponse(response);
  } catch (error) {
    console.error(
      "General Fetch Error in getAnalyticalDevlopRawByIdAction:",
      error,
    );

    return null;
  }
}

/**
 * ۴. ویرایش رکورد Analytical Develop Raw
 */
export async function updateAnalyticalDevlopRawAction(
  projectId,
  rawId,
  payload,
) {
  if (!projectId || !rawId) {
    return {
      error: true,
      message: "شناسه پروژه و رکورد الزامی است",
    };
  }

  const prepared = prepareRequestBody(
    payload,
    updateAnalyticalDevlopRawSchema,
    true,
  );

  if (prepared.error) {
    return prepared;
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-raw/${rawId}`,
      {
        method: "PATCH",
        body: prepared.body,
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message:
          data?.message || "خطا در به‌روزرسانی رکورد",
        details: data?.errors,
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(
      `/contract-projects/${projectId}/analytical-devlop-raw`,
    );
    revalidatePath(
      `/contract-projects/${projectId}/analytical-devlop-raw/${rawId}`,
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in updateAnalyticalDevlopRawAction:",
      error,
    );

    return {
      error: true,
      message: error?.message || "خطا در ارتباط با سرور",
    };
  }
}

/**
 * ۵. حذف رکورد Analytical Develop Raw
 */
export async function deleteAnalyticalDevlopRawAction(
  projectId,
  rawId,
) {
  if (!projectId || !rawId) {
    return {
      error: true,
      message: "شناسه پروژه و رکورد الزامی است",
    };
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/analytical-devlop-raw/${rawId}`,
      {
        method: "DELETE",
      },
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
      `/contract-projects/${projectId}/analytical-devlop-raw`,
    );

    return data;
  } catch (error) {
    console.error(
      "Connection Error in deleteAnalyticalDevlopRawAction:",
      error,
    );

    return {
      error: true,
      message: error?.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}
