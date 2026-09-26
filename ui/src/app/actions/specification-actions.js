"use server";

import { revalidatePath } from "next/cache";
import {
  specificationSchema,
  updateSpecificationSchema,
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

export async function createSpecificationAction(payload) {
  const validated = specificationSchema.safeParse(payload);

  if (!validated.success) {
    console.error("Zod Validation Error:", validated.error.flatten()); // لاگ خطای Zod
    return { error: true, message: "Validation error" };
  }

  try {
    const res = await fetchApi("/specification", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });

    const errorData = await res.json().catch(() => ({})); 

    if (!res.ok) {
      console.error("Server Error Response:", errorData); // لاگ بسیار مهم!
      return { 
        error: true, 
        message: errorData.message || errorData.error || "Server rejected the request" 
      };
    }

    revalidatePath("/specifications");
    revalidatePath("/drug-products");
    return errorData;
  } catch (error) {
    console.error("Connection Error:", error);
    return { error: true, message: "Failed to connect to server" };
  }
}


export async function getSpecificationsAction() {
  try {
    const res = await fetchApi("/specification");

    if (!res.ok) {
      let errorData = { message: "Failed to fetch specifications" };
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
    console.error("Fetch Error in getSpecificationsAction:", error);
    return [];
  }
}

export async function getSpecificationByIdAction(id) {
  if (!id) {
    return null;
  }

  try {
    const res = await fetchApi(`/specification/${id}`);

    if (!res.ok) {
      let errorData = { message: "Failed to fetch specification" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      console.error(
        `Fetch Error in getSpecificationByIdAction for ID ${id}:`,
        errorData.message
      );
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("General Fetch Error in getSpecificationByIdAction:", error);
    return null;
  }
}

export async function updateSpecificationAction(id, payload) {
  if (!id) {
    return {
      error: true,
      message: "Specification ID is required",
    };
  }

  const validated = updateSpecificationSchema.safeParse(payload);

  if (!validated.success) {
    return {
      error: validated.error.flatten(),
    };
  }

  try {
    const res = await fetchApi(`/specification/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validated.data),
    });

    if (!res.ok) {
      let errorData = { message: "Error updating specification" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return { error: true, message: errorData.message };
    }

    const result = await res.json();
    revalidatePath("/specifications");
    revalidatePath(`/specifications/${id}`);
    revalidatePath("/drug-products");
    return result;
  } catch (error) {
    return {
      error: true,
      message: error.message || "Failed to connect to server",
    };
  }
}

export async function deleteSpecificationAction(id) {
  if (!id) {
    return {
      error: true,
      message: "Specification ID is required",
    };
  }

  try {
    const res = await fetchApi(`/specification/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      let errorData = { message: "Error deleting specification" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return { error: true, message: errorData.message };
    }

    const result = await res.json();
    revalidatePath("/specifications");
    revalidatePath("/drug-products");
    return result;
  } catch (error) {
    return {
      error: true,
      message: error.message || "Failed to connect to server",
    };
  }
}
