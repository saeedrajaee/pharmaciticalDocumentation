import { getContractProductsAction } from "@/app/actions/contract-product-action";
import { getDrugProductsAction } from "@/app/actions/drug-product";
import ContractProductsClient from "@/components/contract-development/ContractProductsClient";


export default async function ContractProductPage() {
  // دریافت داده‌ها با اکشن جدید
  const response = await getContractProductsAction();

  // اطمینان از اینکه خروجی حتماً آرایه باشد (حتی اگر سرور داده را در res.data بپیچد)
  const initialProducts = Array.isArray(response)
    ? response
    : Array.isArray(response?.data)
    ? response.data
    : [];

  return <ContractProductsClient initialProjects={initialProducts} />;
}
