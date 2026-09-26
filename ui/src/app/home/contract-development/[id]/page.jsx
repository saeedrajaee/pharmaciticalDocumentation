import ContractProgressModal from "@/components/contract-development/[id]/ContractProgressModal";

export default async function ContractDevelopmentPage({ params }) {
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  if (!id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-red-600">Invalid Route</h2>
          <p className="mt-2 text-sm text-slate-600">Project ID not found.</p>
        </div>
      </div>
    );
  }

  // فعلاً داده تستی
  // بعداً اگر خواستی از دیتابیس/اکشن بخوانیم این بخش را جایگزین می‌کنیم
  const project = {
    id,
    projectCode: `PRJ-${id}`,
    title: "Contract R&D Development",
    dosageForm: "Sterile Solution",
    strength: "500 mg / 5 mL",
    developerName: "Dr. Enteshari",
    apiName: "Active Pharmaceutical Ingredient",
    step: 1,
  };

  return <ContractProgressModal project={project} />;
}
