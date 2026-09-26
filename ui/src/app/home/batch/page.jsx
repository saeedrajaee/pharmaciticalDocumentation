import BatchClient from "@/components/batchs/BatchClient";
import { getBatchAction } from "@/app/actions/batch-actions";
import { getSession } from "@/lib/session";

export default async function BatchPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/signin");
  }

  const initialBatch = await getBatchAction();

  return <BatchClient initialBatch={initialBatch || []} />;
}

