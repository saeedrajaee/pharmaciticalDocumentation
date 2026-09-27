"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createStep7FormulationDevelopmentSchema,
  updateStep7FormulationDevelopmentSchema,
} from "./validations/validation";

const API_BASE = BACKEND_URL;
const RESOURCE_PATH = "furmolation-develop";

async function fetchApi(endpoint, options = {}) {
  const session = await getSession();

  const token =
    session?.accessToken ||
    session?.token ||
    session?.user?.accessToken ||
    session?.user?.token ||
    null;

  return fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });
}

async function parseResponse(response) {
  return response.json().catch(() => ({}));
}

/**
 * استخراج فیلدهای Step 7 از FormData.
 * این مرحله فایل آپلودی ندارد؛ بنابراین بدنه درخواست JSON خواهد بود.
 */
function getFormDataValidationData(formData) {
  const data = {};
  const fields = ["furmol", "date", "manufacturingMethod", "packaging"];

  for (const field of fields) {
    if (formData.has(field)) {
      data[field] = formData.get(field);
    }
  }

  return data;
}

function prepareRequestBody(payload, schema, isUpdate = false) {
  const validationData =
    payload instanceof FormData
      ? getFormDataValidationData(payload)
      : payload || {};

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
    body: JSON.stringify(validated.data),
  };
}

function revalidateStep7Paths(projectId, recordId) {
  revalidatePath(`/contract-projects/${projectId}`);
  revalidatePath(
    `/contract-projects/${projectId}/${RESOURCE_PATH}`,
  );

  if (recordId) {
    revalidatePath(
      `/contract-projects/${projectId}/${RESOURCE_PATH}/${recordId}`,
    );
  }
}

/**
 * ایجاد رکورد Step 7
 */
export async function createFurmolationDevelopAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  const prepared = prepareRequestBody(
    payload,
    createStep7FormulationDevelopmentSchema,
  );

  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/${RESOURCE_PATH}`,
      {
        method: "POST",
        body: prepared.body,
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در ثبت اطلاعات Formulation Development",
        details: data?.errors,
      };
    }

    revalidateStep7Paths(projectId);
    return data;
  } catch (error) {
    console.error("Connection Error in createFurmolationDevelopAction:", error);
    return { error: true, message: "خطا در برقراری ارتباط با سرور" };
  }
}

/**
 * دریافت تمام رکوردهای Step 7 یک پروژه
 */
export async function getFurmolationDevelopListAction(projectId) {
  if (!projectId) return [];

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/${RESOURCE_PATH}`,
      { method: "GET" },
    );

    if (!response.ok) {
      const data = await parseResponse(response);
      console.error(
        "Fetch Error in getFurmolationDevelopListAction:",
        data?.message || "خطا در دریافت رکوردها",
      );
      return [];
    }

    return await parseResponse(response);
  } catch (error) {
    console.error("Fetch Error in getFurmolationDevelopListAction:", error);
    return [];
  }
}

/**
 * دریافت یک رکورد Step 7 بر اساس شناسه
 */
export async function getFurmolationDevelopByIdAction(projectId, recordId) {
  if (!projectId || !recordId) return null;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/${RESOURCE_PATH}/${recordId}`,
      { method: "GET" },
    );

    if (!response.ok) {
      const data = await parseResponse(response);
      console.error(
        "Fetch Error in getFurmolationDevelopByIdAction:",
        data?.message || "رکورد مورد نظر یافت نشد",
      );
      return null;
    }

    return await parseResponse(response);
  } catch (error) {
    console.error("Fetch Error in getFurmolationDevelopByIdAction:", error);
    return null;
  }
}

/**
 * ویرایش رکورد Step 7
 */
export async function updateFurmolationDevelopAction(
  projectId,
  recordId,
  payload,
) {
  if (!projectId || !recordId) {
    return {
      error: true,
      message: "شناسه پروژه و رکورد الزامی است",
    };
  }

  const prepared = prepareRequestBody(
    payload,
    updateStep7FormulationDevelopmentSchema,
    true,
  );

  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/${RESOURCE_PATH}/${recordId}`,
      {
        method: "PATCH",
        body: prepared.body,
      },
    );

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در به‌روزرسانی رکورد",
        details: data?.errors,
      };
    }

    revalidateStep7Paths(projectId, recordId);
    return data;
  } catch (error) {
    console.error("Connection Error in updateFurmolationDevelopAction:", error);
    return {
      error: true,
      message: error?.message || "خطا در ارتباط با سرور",
    };
  }
}

/**
 * حذف رکورد Step 7
 */
export async function deleteFurmolationDevelopAction(projectId, recordId) {
  if (!projectId || !recordId) {
    return {
      error: true,
      message: "شناسه پروژه و رکورد الزامی است",
    };
  }

  try {
    const response = await fetchApi(
      `/contract-projects/${projectId}/${RESOURCE_PATH}/${recordId}`,
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

    revalidateStep7Paths(projectId);
    return data;
  } catch (error) {
    console.error("Connection Error in deleteFurmolationDevelopAction:", error);
    return {
      error: true,
      message: error?.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}
