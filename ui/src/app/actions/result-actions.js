"use server";

import { revalidatePath } from "next/cache";
import {
  resultSchema,
  updateResultSchema,
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

export async function createResultAction(payload) {
  const validated = resultSchema.safeParse(payload);

  if (!validated.success) {
    return {
      error: validated.error.flatten(),
    };
  }

  try {
    const res = await fetchApi("/result", {
      method: "POST",
      body: JSON.stringify(validated.data),
    });

    if (!res.ok) {
      let errorData = { message: "Error creating result" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return { error: true, message: errorData.message };
    }

    const result = await res.json();
    revalidatePath("/results");
    revalidatePath("/batches");
    return result;
  } catch (error) {
    return {
      error: true,
      message: error.message || "Failed to connect to server",
    };
  }
}

export async function getResultsAction() {
  try {
    const res = await fetchApi("/result");

    if (!res.ok) {
      let errorData = { message: "Failed to fetch results" };
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
    console.error("Fetch Error in getresultsAction:", error);
    return [];
  }
}

export async function getResultByIdAction(id) {
  if (!id) {
    return null;
  }

  try {
    const res = await fetchApi(`/result/${id}`);

    if (!res.ok) {
      let errorData = { message: "Failed to fetch result" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      console.error(
        `Fetch Error in getresultByIdAction for ID ${id}:`,
        errorData.message
      );
      return null;
    }

    return await res.json();
  } catch (error) {
    console.error("General Fetch Error in getresultByIdAction:", error);
    return null;
  }
}

export async function updateResultAction(id, payload) {
  if (!id) {
    return {
      error: true,
      message: "result ID is required",
    };
  }

  const validated = updateResultSchema.safeParse(payload);

  if (!validated.success) {
    return {
      error: validated.error.flatten(),
    };
  }

  try {
    const res = await fetchApi(`/result/${id}`, {
      method: "PATCH",
      body: JSON.stringify(validated.data),
    });

    if (!res.ok) {
      let errorData = { message: "Error updating result" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return { error: true, message: errorData.message };
    }

    const result = await res.json();
    revalidatePath("/results");
    revalidatePath(`/results/${id}`);
    revalidatePath("/batches");
    return result;
  } catch (error) {
    return {
      error: true,
      message: error.message || "Failed to connect to server",
    };
  }
}

export async function deleteResultAction(id) {
  if (!id) {
    return {
      error: true,
      message: "result ID is required",
    };
  }

  try {
    const res = await fetchApi(`/result/${id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      let errorData = { message: "Error deleting result" };
      try {
        errorData = await res.json();
      } catch (e) {
        const text = await res.text();
        errorData.message = text || errorData.message;
      }
      return { error: true, message: errorData.message };
    }

    const result = await res.json();
    revalidatePath("/results");
    revalidatePath("/batches");
    return result;
  } catch (error) {
    return {
      error: true,
      message: error.message || "Failed to connect to server",
    };
  }
}
