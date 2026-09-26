"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createRawMaterialCoaSchema,
  updateRawMaterialCoaSchema,
} from "./validations/validation";

const API_BASE = BACKEND_URL;

/**
 * تابع کمکی ارسال درخواست‌ها به بک‌اند با پشتیبانی از JSON و FormData (فایل)
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();
  
  // استخراج توکن با پوشش تمام ساختارهای ذخیره‌سازی سشن
  const token =
    session?.accessToken ||
    session?.accessToken ||
    session?.token ||
    session?.user?.token ||
    null;

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
 * ۱. ایجاد رکورد جدید آنالیز ماده اولیه (COA)
 */
export async function createRawMaterialCoaAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  let body;
  let validationData = {};

  if (payload instanceof FormData) {
    body = payload;
    validationData = {
      materialName: payload.get("materialName"),
      manufacturer: payload.get("manufacturer"),
      resultAnalysis: payload.get("resultAnalysis"),
      analysisDate: payload.get("analysisDate") || undefined,
    };
  } else {
    validationData = payload;
    body = JSON.stringify(payload);
  }

  // اعتبارسنجی با Zod
  const validated = createRawMaterialCoaSchema.safeParse(validationData);
  if (!validated.success) {
    console.error("Zod Validation Error:", validated.error.flatten());
    return {
      error: true,
      message: "خطا در اعتبارسنجی داده‌ها",
      details: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await fetchApi(`/contract-projects/${projectId}/raw-material-coa`, {
      method: "POST",
      body: body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Server Error Response:", data);
      return {
        error: true,
        message: data.message || "خطا در ثبت رکورد COA",
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/raw-material-coa`);
    return data;
  } catch (error) {
    console.error("Connection Error in createRawMaterialCoaAction:", error);
    return { error: true, message: "خطا در برقراری ارتباط با سرور" };
  }
}

/**
 * ۲. دریافت لیست تمام رکوردهای COA یک پروژه
 */
export async function getRawMaterialCoaListAction(projectId) {
  if (!projectId) return [];

  try {
    const res = await fetchApi(`/contract-projects/${projectId}/raw-material-coa`);

    if (!res.ok) {
      let errorData = { message: "خطا در دریافت رکوردهای COA" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      console.error(`Fetch Error for project ${projectId}:`, errorData.message);
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch Error in getRawMaterialCoaListAction:", error);
    return [];
  }
}

/**
 * ۳. دریافت جزئیات یک رکورد COA خاص
 */
export async function getRawMaterialCoaByIdAction(projectId, coaId) {
  if (!projectId || !coaId) return null;

  try {
    const res = await fetchApi(`/contract-projects/${projectId}/raw-material-coa/${coaId}`);

    if (!res.ok) {
      let errorData = { message: "رکورد COA مورد نظر یافت نشد" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      console.error(`Fetch Error in getRawMaterialCoaByIdAction (COA: ${coaId}):`, errorData.message);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("General Fetch Error in getRawMaterialCoaByIdAction:", error);
    return null;
  }
}

/**
 * ۴. ویرایش یک رکورد COA
 */
export async function updateRawMaterialCoaAction(projectId, coaId, payload) {
  if (!projectId || !coaId) {
    return { error: true, message: "شناسه پروژه و رکورد COA الزامی است" };
  }

  let body;
  let validationData = {};

  if (payload instanceof FormData) {
    body = payload;
    if (payload.has("materialName"))
      validationData.materialName = payload.get("materialName");
    if (payload.has("manufacturer"))
      validationData.manufacturer = payload.get("manufacturer");
    if (payload.has("resultAnalysis"))
      validationData.resultAnalysis = payload.get("resultAnalysis");
    if (payload.has("analysisDate"))
      validationData.analysisDate = payload.get("analysisDate") || undefined;
  } else {
    validationData = payload;
    body = JSON.stringify(payload);
  }

  const validated = updateRawMaterialCoaSchema.safeParse(validationData);
  if (!validated.success) {
    return {
      error: true,
      message: "خطا در اعتبارسنجی مقادیر ویرایش",
      details: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await fetchApi(`/contract-projects/${projectId}/raw-material-coa/${coaId}`, {
      method: "PATCH",
      body: body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: true,
        message: data.message || "خطا در به‌روزرسانی رکورد COA",
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/raw-material-coa`);
    revalidatePath(`/contract-projects/${projectId}/raw-material-coa/${coaId}`);
    return data;
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطا در ارتباط با سرور",
    };
  }
}

/**
 * ۵. حذف یک رکورد COA
 */
export async function deleteRawMaterialCoaAction(projectId, coaId) {
  if (!projectId || !coaId) {
    return {
      error: true,
      message: "شناسه پروژه و رکورد COA الزامی است",
    };
  }

  try {
    const res = await fetchApi(`/contract-projects/${projectId}/raw-material-coa/${coaId}`, {
      method: "DELETE",
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: true,
        message: data.message || "خطا در حذف رکورد COA",
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/raw-material-coa`);
    return data;
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}
