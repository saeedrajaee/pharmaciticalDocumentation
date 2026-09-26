"use server";

import { revalidatePath } from "next/cache";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";
import { contractProjectSchema, updateContractProjectSchema } from "./validations/validation";

const API_BASE = BACKEND_URL;

async function fetchApi(endpoint, options = {}) {
  const session = await getSession();
  const token = session?.accessToken || null;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    cache: "no-store",
  });

  return response;
}

export async function createContractProductAction(data) {
  const validated = contractProjectSchema.safeParse(data);
  if (!validated.success) {
    const errorMsg = Object.values(validated.error.flatten().fieldErrors).flat().join(" - ");
    return { error: true, message: errorMsg || "داده‌های ورودی نامعتبر هستند" };
  }

  try {
    const res = await fetchApi("/contract-projects", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ message: "خطا در ایجاد پروژه قراردادی" }));
      return { error: true, message: errorData.message || "خطای سرور" };
    }

    const result = await res.json();
    revalidatePath("/home/contract-projects");
    return result;
  } catch (error) {
    return {
      error: true,
      message: error.message || "اتصال به سرور برقرار نشد",
    };
  }
}

export async function updateContractProductAction(id, data) {
  const validated = updateContractProjectSchema.safeParse(data);
  if (!validated.success) {
    const errorMsg = Object.values(validated.error.flatten().fieldErrors).flat().join(" - ");
    return { error: true, message: errorMsg || "داده‌های ورودی نامعتبر هستند" };
  }

  try {
    const res = await fetchApi(`/contract-projects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validated.data),
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ message: "خطا در ویرایش پروژه قراردادی" }));
      return { error: true, message: errorData.message || "خطای سرور" };
    }

    const result = await res.json();
    revalidatePath("/home/contract-projects");
    return result;
  } catch (error) {
    return {
      error: true,
      message: error.message || "اتصال به سرور برقرار نشد",
    };
  }
}

export async function deleteContractProductAction(id) {
  try {
    const res = await fetchApi(`/contract-projects/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const errorData = await res
        .json()
        .catch(() => ({ message: "خطا در حذف پروژه قراردادی" }));
      return { error: true, message: errorData.message || "خطای سرور" };
    }

    const result = await res.json();
    revalidatePath("/home/contract-projects");
    return result;
  } catch (error) {
    return {
      error: true,
      message: error.message || "اتصال به سرور برقرار نشد",
    };
  }
}

export async function getContractProductsAction() {
  try {
    const res = await fetchApi("/contract-projects");

    if (!res.ok) {
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch Error in getContractProductsAction:", error);
    return [];
  }
}

export async function getContractProductByIdAction(id) {
  try {
    const res = await fetchApi(`/contract-projects/${id}`);

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error(`Error in getContractProductByIdAction for ID ${id}:`, error);
    return null;
  }
}
