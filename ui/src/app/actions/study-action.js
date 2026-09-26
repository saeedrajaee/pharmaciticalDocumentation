"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createStudySchema,updateStudySchema
} from "./validations/validation";

const API_BASE = BACKEND_URL;

/**
 * تابع کمکی ارسال درخواست‌ها به بک‌اند با پشتیبانی از JSON و FormData (فایل)
 */
async function fetchApi(endpoint, options = {}) {
  const session = await getSession();
  const token = session?.user?.accessToken || session?.accessToken || null;

  const headers = {
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // اگر بادی از نوع FormData نباشد، پیش‌فرض JSON ست می‌شود
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
 * ۱. ایجاد یک مطالعه جدید (با پشتیبانی از آپلود فایل یا داده خالص)
 * @param {number} projectId شناسه پروژه
 * @param {FormData | object} payload داده‌های فرم یا آبجکت متناسب با CreateStep1LiteratureStudyDto
 */
export async function createStudyAction(projectId, payload) {
  if (!projectId) {
    return { error: true, message: "شناسه پروژه الزامی است" };
  }

  let body;
  let validationData = {};

  if (payload instanceof FormData) {
    body = payload;
    validationData = {
      type: payload.get("type"),
      title: payload.get("title"),
      reference: payload.get("reference"),
      summary: payload.get("summary") || undefined,
    };
  } else {
    validationData = payload;
    body = JSON.stringify(payload);
  }

  // اعتبارسنجی با Zod
  const validated = createStudySchema.safeParse(validationData);
  if (!validated.success) {
    console.error("Zod Validation Error:", validated.error.flatten());
    return {
      error: true,
      message: "خطا در اعتبارسنجی داده‌ها",
      details: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await fetchApi(`/contract-projects/${projectId}/studies`, {
      method: "POST",
      body: body,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("Server Error Response:", data);
      return {
        error: true,
        message: data.message || "خطا در ثبت مطالعه توسط سرور",
      };
    }

    // بروزرسانی کش صفحات مرتبط
    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/studies`);
    return data;
  } catch (error) {
    console.error("Connection Error in createStudyAction:", error);
    return { error: true, message: "خطا در برقراری ارتباط با سرور" };
  }
}

/**
 * ۲. دریافت لیست تمامی مطالعات یک پروژه
 * @param {number} projectId
 */
export async function getStudiesAction(projectId) {
  if (!projectId) return [];

  try {
    const res = await fetchApi(`/contract-projects/${projectId}/studies`);

    if (!res.ok) {
      let errorData = { message: "خطا در دریافت مطالعات" };
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
    console.error("Fetch Error in getStudiesAction:", error);
    return [];
  }
}

/**
 * ۳. دریافت جزئیات یک مطالعه خاص
 * @param {number} projectId
 * @param {number} studyId
 */
export async function getStudyByIdAction(projectId, studyId) {
  if (!projectId || !studyId) return null;

  try {
    const res = await fetchApi(
      `/contract-projects/${projectId}/studies/${studyId}`
    );

    if (!res.ok) {
      let errorData = { message: "مطالعه مورد نظر یافت نشد" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      console.error(
        `Fetch Error in getStudyByIdAction (Study: ${studyId}):`,
        errorData.message
      );
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("General Fetch Error in getStudyByIdAction:", error);
    return null;
  }
}

/**
 * ۴. ویرایش یک مطالعه
 * @param {number} projectId
 * @param {number} studyId
 * @param {FormData | object} payload
 */
export async function updateStudyAction(projectId, studyId, payload) {
  if (!projectId || !studyId) {
    return { error: true, message: "شناسه پروژه و مطالعه الزامی است" };
  }

  let body;
  let validationData = {};

  if (payload instanceof FormData) {
    body = payload;
    // فقط فیلدهایی که در FormData موجود هستند را استخراج می‌کنیم
    if (payload.has("type")) validationData.type = payload.get("type");
    if (payload.has("title")) validationData.title = payload.get("title");
    if (payload.has("reference"))
      validationData.reference = payload.get("reference");
    if (payload.has("summary"))
      validationData.summary = payload.get("summary") || undefined;
  } else {
    validationData = payload;
    body = JSON.stringify(payload);
  }

  const validated = updateStudySchema.safeParse(validationData);
  if (!validated.success) {
    return {
      error: true,
      message: "خطا در اعتبارسنجی مقادیر ویرایش",
      details: validated.error.flatten().fieldErrors,
    };
  }

  try {
    const res = await fetchApi(
      `/contract-projects/${projectId}/studies/${studyId}`,
      {
        method: "PATCH",
        body: body,
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: true,
        message: data.message || "خطا در به‌روزرسانی مطالعه",
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/studies`);
    revalidatePath(`/contract-projects/${projectId}/studies/${studyId}`);
    return data;
  } catch (error) {
    return {
      error: true,
      message: error.message || "خطا در ارتباط با سرور",
    };
  }
}

/**
 * ۵. حذف یک مطالعه
 * @param {number} projectId
 * @param {number} studyId
 */
export async function deleteStudyAction(projectId, studyId) {
  if (!projectId || !studyId) {
    return {
      error: true,
      message: "شناسه پروژه و مطالعه الزامی است",
    };
  }

  try {
    const res = await fetchApi(
      `/contract-projects/${projectId}/studies/${studyId}`,
      {
        method: "DELETE",
      }
    );

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        error: true,
        message: data.message || "خطا در حذف مطالعه",
      };
    }

    revalidatePath(`/contract-projects/${projectId}`);
    revalidatePath(`/contract-projects/${projectId}/studies`);
    return data;
  } catch (error) {
    return {
      error: true,
      message: error.message || "خطا در برقراری ارتباط با سرور",
    };
  }
}
