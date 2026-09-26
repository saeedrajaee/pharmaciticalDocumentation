import { cookies } from "next/headers";

export async function getAuthHeader() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return {};

  return {
    Authorization: `Bearer ${token}`,
  };
}