import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GuestHome from "@/components/home/GuestHome";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    redirect("/home");
  }

  return <GuestHome />;
}
