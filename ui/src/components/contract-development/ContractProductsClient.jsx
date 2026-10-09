"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createContractProductAction,
  deleteContractProductAction,
  updateContractProductAction,
} from "@/app/actions/contract-product-action";

const dosageOptions = [
  "All",
  "Solution",
  "Solid",
  "Semisolid",
  "Lyophilized Powder",
  "Suppository",
  "Ointment/Cream",
];

export const WORKFLOW_STEP_NAMES = {
  1: "Pre-formulation",
  2: "Method Dev",
  3: "Method Validation",
  4: "Formulation Dev",
  5: "Stability",
  6: "Scale-up",
  7: "Tech Transfer",
  8: "Regulatory/CTD",
};

export const STEP_OPTIONS = [
  { value: 1, label: "Step 1: Pre-formulation Studies" },
  { value: 2, label: "Step 2: Analytical Method Development" },
  { value: 3, label: "Step 3: Analytical Method Validation" },
  { value: 4, label: "Step 4: Formulation Development" },
  { value: 5, label: "Step 5: Stability Studies" },
  { value: 6, label: "Step 6: Scale-up" },
  { value: 7, label: "Step 7: Tech Transfer" },
  { value: 8, label: "Step 8: Regulatory / CTD" },
];

const emptyForm = {
  projectCode: "",
  title: "",
  apiName: "",
  dosageForm: "Solution",
  strength: "",
  developerName: "",
  developerPhone: "",
  step: "1",
};

// تابع استخراج استپ‌ها با مقاومت در برابر انواع فرمت دیتابیس
function getCompletedStepList(project) {
  if (!project) return [];

  const foundSteps = new Set();

  // الف) اگر آرایه یا استرینگ completedSteps در مدل ذخیره شده باشد
  if (Array.isArray(project.completedSteps)) {
    project.completedSteps.forEach((s) => foundSteps.add(Number(s)));
  } else if (typeof project.completedSteps === "string" && project.completedSteps.trim()) {
    try {
      const parsed = JSON.parse(project.completedSteps);
      if (Array.isArray(parsed)) parsed.forEach((s) => foundSteps.add(Number(s)));
    } catch {
      project.completedSteps.split(",").forEach((s) => {
        const n = Number(s.trim());
        if (n) foundSteps.add(n);
      });
    }
  }

  // ب) بررسی مستقیم بر اساس ساختار روابط اگر include شده باشند
  const hasStudies = (project.studies?.length > 0) || Boolean(project.preformulationDone);
  const hasBom = project.boms?.some((b) => b?.bomFileUrl?.trim());
  const hasCoa = project.rawMaterialCoas?.length > 0;
  const hasPkg = project.packagings?.length > 0;

  if (hasStudies && (hasBom || hasCoa || hasPkg)) {
    foundSteps.add(1);
  }

  if (project.scaleUpTrials?.length > 0 || project.isScaleUpCompleted) {
    foundSteps.add(6);
  }

  if (project.scaleUpFinal || project.isTechTransferCompleted) {
    foundSteps.add(7);
  }

  if (project.ctdModule || project.isCtdCompleted) {
    foundSteps.add(8);
  }

  // ج) فال‌بک سیستم گردش کار: اگر فیلد صریح step بیشتر از ۱ باشد، یعنی مراحل قبلی رد شده‌اند
  const activeStepNum = Number(project.step);
  if (foundSteps.size === 0 && activeStepNum > 1) {
    for (let i = 1; i < activeStepNum; i++) {
      foundSteps.add(i);
    }
  }

  return Array.from(foundSteps).sort((a, b) => a - b);
}

export default function ContractProjectsClient({ initialProjects }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects || []);
  const [search, setSearch] = useState("");
  const [dosageFilter, setDosageFilter] = useState("All");
  const [editingItem, setEditingItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pending, startTransition] = useTransition();

  const filteredProjects = useMemo(() => {
    return projects.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        item.projectCode?.toLowerCase().includes(query) ||
        item.title?.toLowerCase().includes(query) ||
        item.apiName?.toLowerCase().includes(query) ||
        item.strength?.toLowerCase().includes(query) ||
        item.developerName?.toLowerCase().includes(query) ||
        item.developerPhone?.toLowerCase().includes(query) ||
        item.user?.name?.toLowerCase().includes(query);

      const matchesFilter =
        dosageFilter === "All" || item.dosageForm === dosageFilter;

      return matchesSearch && matchesFilter;
    });
  }, [projects, search, dosageFilter]);

  async function handleCreate(formData) {
    const payload = {
      projectCode: formData.get("projectCode"),
      title: formData.get("title"),
      apiName: formData.get("apiName"),
      dosageForm: formData.get("dosageForm"),
      strength: formData.get("strength"),
      developerName: formData.get("developerName"),
      developerPhone: formData.get("developerPhone"),
      step: Number(formData.get("step")) || 1,
    };

    startTransition(async () => {
      const result = await createContractProductAction(payload);
      if (result?.error) {
        alert(result?.message || "Failed to create project");
        return;
      }
      const newItem = result?.data || result;
      if (newItem?.id) {
        setProjects((prev) => [newItem, ...prev]);
      }
      setShowCreate(false);
      router.refresh();
    });
  }

  async function handleUpdate(formData) {
    if (!editingItem?.id) return;

    const payload = {
      projectCode: formData.get("projectCode"),
      title: formData.get("title"),
      apiName: formData.get("apiName"),
      dosageForm: formData.get("dosageForm"),
      strength: formData.get("strength"),
      developerName: formData.get("developerName"),
      developerPhone: formData.get("developerPhone"),
      step: Number(formData.get("step")) || 1,
    };

    startTransition(async () => {
      const result = await updateContractProductAction(editingItem.id, payload);
      if (result?.error) {
        alert(result?.message || "Failed to update project");
        return;
      }
      const updatedItem = result?.data || result;
      setProjects((prev) =>
        prev.map((item) => (item.id === editingItem.id ? { ...item, ...updatedItem } : item))
      );
      setEditingItem(null);
      router.refresh();
    });
  }

  function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this contract project?")) return;

    startTransition(async () => {
      const result = await deleteContractProductAction(id);
      if (result?.error) {
        alert(result?.message || "Delete failed");
        return;
      }
      setProjects((prev) => prev.filter((item) => item.id !== id));
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-wide text-slate-800">
                Contract R&amp;D Projects
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Manage formulation workflows and monitor validation steps
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/home"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Back to Home
              </Link>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition hover:from-sky-500 hover:to-indigo-500"
              >
                + Add Contract Development
              </button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Search by code, title, API, developer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
            />
            <select
              value={dosageFilter}
              onChange={(e) => setDosageFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
            >
              {dosageOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-100/80">
                  <tr className="text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-3.5 font-bold">No.</th>
                    <th className="px-4 py-3.5 font-bold">Code</th>
                    <th className="px-4 py-3.5 font-bold">Title</th>
                    <th className="px-4 py-3.5 font-bold">API</th>
                    <th className="px-4 py-3.5 font-bold">Form</th>
                    <th className="px-4 py-3.5 font-bold">Developer</th>
                    <th className="px-4 py-3.5 font-bold">Completed Steps</th>
                    <th className="px-4 py-3.5 font-bold text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((item, index) => {
                      const completedSteps = getCompletedStepList(item);

                      return (
                        <tr key={item.id} className="text-sm text-slate-700 hover:bg-sky-50/30">
                          <td className="px-4 py-3.5 text-slate-400">{index + 1}</td>
                          <td className="px-4 py-3.5 font-mono font-bold text-sky-700">
                            {item.projectCode}
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-slate-900">
                            {item.title}
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">{item.apiName}</td>
                          <td className="px-4 py-3.5">
                            <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                              {item.dosageForm}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-medium">{item.developerName}</td>

                          {/* نمایش استپ‌های تکمیل‌شده */}
                          <td className="px-4 py-3.5">
                            {completedSteps.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1.5 max-w-[240px]">
                                {completedSteps.map((stepNum) => (
                                  <span
                                    key={stepNum}
                                    title={`Step ${stepNum}: ${WORKFLOW_STEP_NAMES[stepNum] || ""}`}
                                    className="inline-flex items-center gap-1 rounded-md border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800"
                                  >
                                    <svg
                                      className="h-2.5 w-2.5 text-emerald-600 shrink-0"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                      strokeWidth={3}
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    Step {stepNum}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                In Progress (Step {item.step || 1})
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="flex flex-wrap items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => router.push(`/home/contract-development/${item.id}`)}
                                className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100"
                              >
                                Contract Progress
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-100"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleDelete(item.id)}
                                className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-sm text-slate-400">
                        No contract projects found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <ContractProjectFormModal
          title="Add Contract Development"
          submitText={pending ? "Creating..." : "Create Contract"}
          defaultValues={emptyForm}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}

      {editingItem && (
        <ContractProjectFormModal
          title="Edit Contract Development"
          submitText={pending ? "Saving..." : "Save Changes"}
          defaultValues={{
            projectCode: editingItem.projectCode || "",
            title: editingItem.title || "",
            apiName: editingItem.apiName || "",
            dosageForm: editingItem.dosageForm || "Solution",
            strength: editingItem.strength || "",
            developerName: editingItem.developerName || "",
            developerPhone: editingItem.developerPhone || "",
            step: editingItem.step ? String(editingItem.step) : "1",
          }}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdate}
        />
      )}
    </div>
  );
}

function ContractProjectFormModal({ title, submitText, defaultValues, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    projectCode: defaultValues.projectCode || "",
    title: defaultValues.title || "",
    apiName: defaultValues.apiName || "",
    dosageForm: defaultValues.dosageForm || "Solution",
    strength: defaultValues.strength || "",
    developerName: defaultValues.developerName || "",
    developerPhone: defaultValues.developerPhone || "",
    step: defaultValues.step || "1",
  });

  const [errorMessage, setErrorMessage] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const isFormValid = Object.values(formData).every(
    (val) => typeof val === "string" && val.trim() !== ""
  );

  const getFieldClassName = (val, extra = "") => {
    const isFilled = typeof val === "string" && val.trim() !== "";
    return `w-full rounded-xl px-4 py-2.5 text-sm outline-none transition ${
      isFilled
        ? "border border-slate-300 bg-white text-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
        : "border border-amber-300 bg-amber-50/40 text-slate-800 placeholder:text-amber-700/40 focus:border-amber-500"
    } ${extra}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMessage("لطفاً تمامی فیلدها را تکمیل نمایید.");
      return;
    }
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v.trim()));
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80 rounded-t-3xl">
          <h2 className="text-lg font-black text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 p-6 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Project Code *</label>
            <input
              name="projectCode"
              value={formData.projectCode}
              onChange={handleChange}
              placeholder="e.g. PRJ-MTX-01"
              className={getFieldClassName(formData.projectCode, "font-mono")}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Project Title *</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Methotrexate Solution"
              className={getFieldClassName(formData.title)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">API Name *</label>
            <input
              name="apiName"
              value={formData.apiName}
              onChange={handleChange}
              placeholder="e.g. Methotrexate"
              className={getFieldClassName(formData.apiName)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Dosage Form *</label>
            <select
              name="dosageForm"
              value={formData.dosageForm}
              onChange={handleChange}
              className={getFieldClassName(formData.dosageForm)}
            >
              <option value="Solution">Solution</option>
              <option value="Solid">Solid</option>
              <option value="Semisolid">Semisolid</option>
              <option value="Lyophilized Powder">Lyophilized Powder</option>
              <option value="Suppository">Suppository</option>
              <option value="Ointment/Cream">Ointment/Cream</option>
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700">Strength *</label>
            <input
              name="strength"
              value={formData.strength}
              onChange={handleChange}
              placeholder="e.g. 50 mg/2 mL"
              className={getFieldClassName(formData.strength)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Developer Name *</label>
            <input
              name="developerName"
              value={formData.developerName}
              onChange={handleChange}
              placeholder="e.g. Dr. Enteshari"
              className={getFieldClassName(formData.developerName)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Developer Phone *</label>
            <input
              name="developerPhone"
              value={formData.developerPhone}
              onChange={handleChange}
              placeholder="0912..."
              className={getFieldClassName(formData.developerPhone, "font-mono")}
            />
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700">Current Step *</label>
            <select
              name="step"
              value={formData.step}
              onChange={handleChange}
              className={getFieldClassName(formData.step)}
            >
              {STEP_OPTIONS.map((step) => (
                <option key={step.value} value={step.value}>
                  {step.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white transition ${
                isFormValid
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
