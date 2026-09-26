"use server";

import { redirect } from "next/navigation";
import { BACKEND_URL } from "./constant";
import { LoginFormSchema, SignupFormSchema } from "./type";
import { createSession } from "./session";

export async function signUp(state, formData) {
  console.log("1......formData........",formData)
  const validationFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    mobile: formData.get("mobile"),
    password: formData.get("password"),
  });

  console.log("1......validationFields........",validationFields)

  if (!validationFields.success) {
    return {
      error: validationFields.error.flatten().fieldErrors,
    };
  }

  const response = await fetch(`${BACKEND_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validationFields.data),
  });

  const data = await response.json();

  if (response.ok) {
    redirect("/auth/signin");
  } else {
    return {
      message:
        response.status === 409
          ? "The user is already existed!"
          : response.statusText,
    };
  }
}

export async function signIn(state, formData) {
  const validationFields = LoginFormSchema.safeParse({
    mobile: formData.get("mobile"),
    password: formData.get("password"),
  });

  if (!validationFields.success) {
    return {
      error: validationFields.error.flatten().fieldErrors,
    };
  }

  const response = await fetch(`${BACKEND_URL}/auth/signin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(validationFields.data),
  });

  if (response.ok) {
    const result = await response.json();

    await createSession({
      user: {
        id: result.id,
        name: result.name,
        role: result.role,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    });

    console.log("result........", result);
    redirect("/home");
  } else {
    return {
      message:
        response.status === 401 ? "invalid Credential" : response.statusText,
    };
  }
}

export const refreshToken = async (oldRefreshToken) => {
  try {
    const response = await fetch(`${BACKEND_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: oldRefreshToken }),
    });

    if (!response.ok) {
      throw new Error("Failed to refresh token");
    }

    const { accessToken, refreshToken } = await response.json();

    const updateRes = await fetch("http://localhost:3000/api/auth/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accessToken,
        refreshToken,
      }),
    });

    if (!updateRes.ok) throw new Error("Failed to update the tokens");

    return accessToken;
  } catch (err) {
    console.error("Refresh Token failed:", err);
    return null;
  }
};

