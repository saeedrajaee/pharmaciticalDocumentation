"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import {
  createContractSpecificationSchema,
  updateContractSpecificationSchema,
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
  const validated = schema.safeParse(validationData);

  if (!validated.success) {
    return {
      error: true,
      message: isUpdate
        ? "خطا در اعتبارسنجی مقادیر ویرایش مشخصات قراردادی"
        : "خطا در اعتبارسنجی داده‌های مشخصات قراردادی",
      details: validated.error.flatten().fieldErrors,
    };
  }

  return {
    body: JSON.stringify(validated.data),
    validationData: validated.data,
  };
}

export async function createContractSpecificationAction(payload) {
  const prepared = prepareJsonRequestBody(
    payload,
    createContractSpecificationSchema,
    false
  );
  if (prepared.error) return prepared;

  try {
    const response = await fetchApi("/contract-specification", {
      method: "POST",
      body: prepared.body,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در ثبت مشخصات قراردادی",
        details: data?.errors,
      };
    }

    revalidatePath("/contract-specifications");
    if (prepared.validationData?.projectId) {
      revalidatePath(`/contract-projects/${prepared.validationData.projectId}`);
      revalidatePath(`/contract-projects/${prepared.validationData.projectId}/specification`);
    }

    return { success: true, data };
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطای ارتباط با سرور",
    };
  }
}

export async function getContractSpecificationByProjectIdAction(projectId) {
  if (!projectId) return null;

  try {
    const response = await fetchApi(
      `/contract-specification/project/${projectId}`,
      { method: "GET" }
    );

    const data = await parseResponse(response);
    if (!response.ok) return null;

    return data;
  } catch (error) {
    console.error("Error fetching specification:", error);
    return null;
  }
}

export async function updateContractSpecificationAction(id, payload) {
  if (!id) return { error: true, message: "شناسه مشخصات قراردادی الزامی است" };

  const prepared = prepareJsonRequestBody(
    payload,
    updateContractSpecificationSchema,
    true
  );
  if (prepared.error) return prepared;

  try {
    const response = await fetchApi(`/contract-specification/${id}`, {
      method: "PATCH",
      body: prepared.body,
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در به‌روزرسانی مشخصات قراردادی",
        details: data?.errors,
      };
    }

    revalidatePath("/contract-specifications");
    revalidatePath(`/contract-specifications/${id}`);
    if (data?.projectId) {
      revalidatePath(`/contract-projects/${data.projectId}`);
      revalidatePath(`/contract-projects/${data.projectId}/specification`);
    }

    return { success: true, data };
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطای سرور در به‌روزرسانی",
    };
  }
}

export async function deleteContractSpecificationAction(id, projectId = null) {
  if (!id) return { error: true, message: "شناسه مشخصات قراردادی الزامی است" };

  try {
    const response = await fetchApi(`/contract-specification/${id}`, {
      method: "DELETE",
    });

    const data = await parseResponse(response);

    if (!response.ok) {
      return {
        error: true,
        message: data?.message || "خطا در حذف مشخصات قراردادی",
        details: data?.errors,
      };
    }

    revalidatePath("/contract-specifications");
    const targetProjectId = projectId || data?.projectId;
    if (targetProjectId) {
      revalidatePath(`/contract-projects/${targetProjectId}`);
      revalidatePath(`/contract-projects/${targetProjectId}/specification`);
    }

    return { success: true, data };
  } catch (error) {
    return {
      error: true,
      message: error?.message || "خطای سرور در حذف رکورد",
    };
  }
}
