import { getSession } from "@/lib/session";

export default async function SpecificationPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  return (
<div>
Specification Page
</div>
  );
}
