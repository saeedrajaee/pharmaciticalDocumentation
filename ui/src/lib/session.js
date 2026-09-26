"use server";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { redirect } from "next/navigation";

const secretKey = process.env.SESSION_SECRET_KEY;
if (!secretKey) {
  throw new Error("SESSION_SECRET_KEY is not defined");
}
const encodedKey = new TextEncoder().encode(secretKey);

export async function createSession(payload) {
  const expiredAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);

  const cookieStore = await cookies();

  cookieStore.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiredAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function getSession() {
  const cookie = (await cookies()).get("session")?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (err) {
    console.error("Failed to verify the session", err);
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();

  cookieStore.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
    maxAge: 0,
  });
}


export async function updateTokens({
  accessToken,
  refreshToken,
}) {
  const cookie = (await cookies()).get("session")?.value;
  if (!cookie) return null;
  
  const existingSession = await getSession(); 

  if (!existingSession) {

      console.error("Cannot update tokens: Session not found or invalid.");

      return null; 
  }

  const newPayload = {
    ...existingSession, // Spread existing payload to keep user details
    accessToken,
    refreshToken,
  };

  await createSession(newPayload);
}
