"use server";

import { revalidatePath } from "next/cache";
import {
  drugProductSchema,
  updateDrugProductSchema,
} from "./validations/validation";
import { BACKEND_URL } from "../../lib/constant";
import { getSession } from "../../lib/session";

const API_BASE = BACKEND_URL;

async function fetchApi(endpoint, options = {}) {
  const session = await getSession();
  const token = session?.accessToken;

  console.log("--- DEBUG START ---");
  console.log("Token Found:", !!token);
  console.log("Full Headers Sent:", {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : "NONE",
  });
  console.log("--- DEBUG END ---");

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

export async function createDrugProductAction(data) {
  const validated = drugProductSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.flatten() };

  try {
    const res = await fetchApi("/drug-product", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });

    if (!res.ok) {
      let errorData = { message: "Error creating drug product" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return { error: true, message: errorData.message };
    }

    const result = await res.json();
    revalidatePath("/home/drug-products");
    return result;
  } catch (error) {
    return { error: true, message: error.message || "Failed to connect to server" };
  }
}

export async function updateDrugProductAction(id, data) {
  const validated = updateDrugProductSchema.safeParse(data);
  if (!validated.success) return { error: validated.error.flatten() };

  try {
    const res = await fetchApi(`/drug-product/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validated.data),
    });

    if (!res.ok) {
      let errorData = { message: "Error updating drug product" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return { error: true, message: errorData.message };
    }

    const result = await res.json();
    revalidatePath("/home/drug-products");
    return result;
  } catch (error) {
    return { error: true, message: error.message || "Failed to connect to server" };
  }
}

export async function deleteDrugProductAction(id) {
  try {
    const res = await fetchApi(`/drug-product/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      let errorData = { message: "Error deleting drug product" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return { error: true, message: errorData.message };
    }

    const result = await res.json();
    revalidatePath("/home/drug-products");
    return result;
  } catch (error) {
    return { error: true, message: error.message || "Failed to connect to server" };
  }
}

export async function getDrugProductsAction() {
  try {
    const res = await fetchApi("/drug-product");

    if (!res.ok) {
      let errorData = { message: "Failed to fetch drug products" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return [];
    }

    return await res.json();
  } catch (error) {
    console.error("Fetch Error in getDrugProductsAction:", error);
    return [];
  }
}

export async function getDrugProductByIdAction(id) {
  try {
    const res = await fetchApi(`/drug-product/${id}`);

    if (!res.ok) {
      let errorData = { message: "Failed to fetch drug product" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      console.error(`Fetch Error in getDrugProductByIdAction for ID ${id}:`, errorData.message);
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("General Fetch Error in getDrugProductByIdAction:", error);
    return null;
  }
}
