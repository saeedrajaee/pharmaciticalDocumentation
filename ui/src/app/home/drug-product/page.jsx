import DrugProductsClient from "@/components/drug-products/DrugProductsClient";
import { getDrugProductsAction } from "@/app/actions/drug-product";

export default async function DrugProductPage() {
  const initialProducts = await getDrugProductsAction();

  return <DrugProductsClient initialProducts={initialProducts || []} />;
}
