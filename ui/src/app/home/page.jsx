import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import DashboardHome from "@/components/home/DashboardHome";

export default async function HomePage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <DashboardHome
      user={{
        name: session?.user?.name || "کاربر",
        role: session?.user?.role || "user",
      }}
    />
  );
}
