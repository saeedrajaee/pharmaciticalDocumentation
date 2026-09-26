"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createPreFormulationSchema,
  updatePreFormulationSchema,
} from "./validations/validation";

const API_BASE = BACKEND_URL;

/**
 * تابع کمکی ارسال درخواست‌ها به بک‌اند با تزریق توکن احراز هویت
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();
  const token = session?.accessToken || null;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  return response;
}

/**
 * استخراج و نرمال‌سازی داده‌ها از Payload ورودی (FormData یا Object خالص)
 */
function extractPreFormulationData(payload) {
  if (payload instanceof FormData) {
    let parts = [];
    const rawParts = payload.get("parts");

    if (rawParts) {
      try {
        parts = typeof rawParts === "string" ? JSON.parse(rawParts) : rawParts;
      } catch (e) {
        console.error("Error parsing parts from FormData:", e);
        parts = [];
      }
    }

    return {
      formul: payload.get("formul") || "",
      description: payload.get("description") || undefined,
      parts: parts,
    };
  }

  return {
    ...payload,
    parts: payload.parts || [],
  };
}

/**
 * ۱. ایجاد رکورد جدید پیش‌فرمولاسیون همراه با لیست اجزا (از مودال)
 * @param {number|string} projectId شناسه پروژه
 * @param {FormData | object} payload داده‌های فرمول و آرایه اجزا (parts)
 */
export async function createPreFormulationAction(projectId, payload) {
  const numericProjectId = Number(projectId);
  if (!numericProjectId) {
    return { error: true, message: "شناسه پروژه الزامی و معتبر است" };
  }

  const extractedData = extractPreFormulationData(payload);

  // اعتبارسنجی داده‌ها با Zod
  const validated = createPreFormulationSchema.safeParse(extractedData);
  if (!validated.success) {
    console.error("Validation error in createPreFormulationAction:", validated.error.flatten());
    return {
      error: true,
      message: "خطا در اعتبارسنجی مقادیر فرمولاسیون",
      details: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await fetchApi(
      `/contract-projects/${numericProjectId}/pre-formulation`,
      {
        method: "POST",
        body: JSON.stringify(validated.data),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Server error response:", data);
      return {
        error: true,
        message: data.message || "خطا در ثبت پیش‌فرمولاسیون توسط سرور",
      };
    }

    // به‌روزرسانی کش صفحات مرتبط
    revalidatePath(`/contract-projects/${numericProjectId}`);
    revalidatePath(`/contract-projects/${numericProjectId}/pre-formulation`);
    return data;
  } catch (error) {
    console.error("Connection error in createPreFormulationAction:", error);
    return { error: true, message: "خطا در برقراری ارتباط با سرور" };
  }
}

/**
 * ۲. دریافت لیست تمام رکوردهای پیش‌فرمولاسیون یک پروژه
 * @param {number|string} projectId شناسه پروژه
 */
export async function getPreFormulationsAction(projectId) {
  const numericProjectId = Number(projectId);
  if (!numericProjectId) return [];

  try {
    const res = await fetchApi(
      `/contract-projects/${numericProjectId}/pre-formulation`
    );

    if (!res.ok) {
      let errorData = { message: "خطا در دریافت اطلاعات پیش‌فرمولاسیون" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      console.error(
        `Fetch Error for pre-formulations (Project: ${numericProjectId}):`,
        errorData.message
      );
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch Error in getPreFormulationsAction:", error);
    return [];
  }
}

/**
 * ۳. دریافت جزئیات یک فرمولاسیون خاص همراه با اجزا
 * @param {number|string} projectId شناسه پروژه
 * @param {number|string} id شناسه فرمولاسیون
 */
export async function getPreFormulationByIdAction(projectId, id) {
  const numericProjectId = Number(projectId);
  const numericId = Number(id);

  if (!numericProjectId || !numericId) return null;

  try {
    const res = await fetchApi(
      `/contract-projects/${numericProjectId}/pre-formulation/${numericId}`
    );

    if (!res.ok) {
      let errorData = { message: "فرمولاسیون مورد نظر یافت نشد" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      console.error(
        `Fetch Error in getPreFormulationByIdAction (ID: ${numericId}):`,
        errorData.message
      );
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch Error in getPreFormulationByIdAction:", error);
    return null;
  }
}

/**
 * ۴. ویرایش یک رکورد پیش‌فرمولاسیون و لیست اجزا
 * @param {number|string} projectId شناسه پروژه
 * @param {number|string} id شناسه فرمولاسیون
 * @param {FormData | object} payload داده‌های ویرایش
 */
export async function updatePreFormulationAction(projectId, id, payload) {
  const numericProjectId = Number(projectId);
  const numericId = Number(id);

  if (!numericProjectId || !numericId) {
    return { error: true, message: "شناسه پروژه و فرمولاسیون الزامی است" };
  }

  const extractedData = extractPreFormulationData(payload);

  const validated = updatePreFormulationSchema.safeParse(extractedData);
  if (!validated.success) {
    return {
      error: true,
      message: "خطا در اعتبارسنجی مقادیر ویرایش",
      details: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await fetchApi(
      `/contract-projects/${numericProjectId}/pre-formulation/${numericId}`,
      {
        method: "PATCH",
        body: JSON.stringify(validated.data),
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: true,
        message: data.message || "خطا در به‌روزرسانی پیش‌فرمولاسیون",
      };
    }

    revalidatePath(`/contract-projects/${numericProjectId}`);
    revalidatePath(`/contract-projects/${numericProjectId}/pre-formulation`);
    revalidatePath(
      `/contract-projects/${numericProjectId}/pre-formulation/${numericId}`
    );
    return data;
  } catch (error) {
    return {
      error: true,
      message: error.message || "خطا در ارتباط با سرور",
    };
  }
}

/**
 * ۵. حذف یک رکورد پیش‌فرمولاسیون
 * @param {number|string} projectId شناسه پروژه
 * @param {number|string} id شناسه فرمولاسیون
 */
export async function deletePreFormulationAction(projectId, id) {
  const numericProjectId = Number(projectId);
  const numericId = Number(id);

  if (!numericProjectId || !numericId) {
    return {
      error: true,
      message: "شناسه پروژه و فرمولاسیون الزامی است",
    };
  }

  try {
    const res = await fetchApi(
      `/contract-projects/${numericProjectId}/pre-formulation/${numericId}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: true,
        message: data.message || "خطا در حذف پیش‌فرمولاسیون",
      };
    }

    revalidatePath(`/contract-projects/${numericProjectId}`);
    revalidatePath(`/contract-projects/${numericProjectId}/pre-formulation`);
    return data;
  } catch (error) {
    return {
      error: true,
      message: error.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}
