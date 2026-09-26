"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  createContractProductAction,
  deleteContractProductAction,
  updateContractProductAction,
} from "@/app/actions/contract-product-action";
// import ContractProjectDetailsModal from "@/components/contract-projects/ContractProjectDetailsModal";

const dosageOptions = [
  "All",
  "Solution",
  "Solid",
  "Semisolid",
  "Lyophilized Powder",
  "Suppository",
  "Ointment/Cream",
];

// لیست مراحل تستی با توضیحات مرحله
export const STEP_OPTIONS = [
  { value: 1, label: "Step 1: Literature Review & Pre-formulation" },
  { value: 2, label: "Step 2: Method Development" },
  { value: 3, label: "Step 3: Lab-Scale Formulation" },
  { value: 4, label: "Step 4: Analytical Method Validation" },
  { value: 5, label: "Step 5: Scale-up & Pilot Batch" },
  { value: 6, label: "Step 6: Stability Studies" },
  { value: 7, label: "Step 7: Dossier Preparation" },
  { value: 8, label: "Step 8: Regulatory Submission" },
  { value: 9, label: "Step 9: Tech Transfer & Validation Batches" },
  { value: 10, label: "Step 10: Commercial Production" },
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

export default function ContractProjectsClient({ initialProjects }) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects || []);
  const [search, setSearch] = useState("");
  const [dosageFilter, setDosageFilter] = useState("All");
  const [detailsItem, setDetailsItem] = useState(null);
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
        alert(result?.message || "Create request failed");
        return;
      }

      if (result?.id) {
        setProjects((prev) => [result, ...prev]);
      } else if (result?.data?.id) {
        setProjects((prev) => [result.data, ...prev]);
      }

      setShowCreate(false);
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
        alert(result?.message || "Update request failed");
        return;
      }

      const updatedItem = result?.data || result;

      setProjects((prev) =>
        prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
      );

      if (detailsItem?.id === editingItem.id) {
        setDetailsItem(updatedItem);
      }

      setEditingItem(null);
    });
  }

  // تغییر سریع مرحله از داخل جدول
  function handleStepChange(id, newStep) {
    startTransition(async () => {
      const result = await updateContractProductAction(id, {
        step: Number(newStep),
      });

      if (result?.error) {
        alert(result?.message || "Update step failed");
        return;
      }

      const updatedItem = result?.data || result;

      setProjects((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, step: Number(newStep), ...updatedItem } : item
        )
      );

      if (detailsItem?.id === id) {
        setDetailsItem((prev) => ({ ...prev, step: Number(newStep) }));
      }
    });
  }

  function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this contract project?"
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteContractProductAction(id);

      if (result?.error) {
        alert(result?.message || "Delete request failed");
        return;
      }

      setProjects((prev) => prev.filter((item) => item.id !== id));

      if (detailsItem?.id === id) {
        setDetailsItem(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/50">
        {/* Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 via-sky-50/40 to-slate-50 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-wide text-slate-800">
                Contract R&amp;D Projects
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Track, develop, review, and manage 10-step contract formulation workflows
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/home"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              >
                Back to Home
              </Link>

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-sky-600/20 transition hover:from-sky-500 hover:to-indigo-500 hover:shadow-lg"
              >
                + Add Contract Development
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search */}
        <div className="p-5">
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Search by code, title, API, developer, phone, or owner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10"
            />

            <select
              value={dosageFilter}
              onChange={(e) => setDosageFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 cursor-pointer"
            >
              {dosageOptions.map((item) => (
                <option key={item} value={item} className="bg-white text-slate-800">
                  {item}
                </option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-200 bg-slate-100/80">
                  <tr className="text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-4 py-3.5 font-bold">No.</th>
                    <th className="px-4 py-3.5 font-bold">Project Code</th>
                    <th className="px-4 py-3.5 font-bold">Title</th>
                    <th className="px-4 py-3.5 font-bold">API Name</th>
                    <th className="px-4 py-3.5 font-bold">Dosage Form</th>
                    <th className="px-4 py-3.5 font-bold">Strength</th>
                    <th className="px-4 py-3.5 font-bold">Developer</th>
                    <th className="px-4 py-3.5 font-bold">Phone</th>
                    <th className="px-4 py-3.5 font-bold">Step</th>
                    <th className="px-4 py-3.5 font-bold text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((item, index) => (
                      <tr
                        key={item.id}
                        className="group text-sm text-slate-700 transition hover:bg-sky-50/40"
                      >
                        <td className="px-4 py-3.5 font-medium text-slate-400">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-sky-700">
                          {item.projectCode}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-900">
                          {item.title}
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-medium">
                          {item.apiName}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                            {item.dosageForm}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600">
                          {item.strength}
                        </td>
                        <td className="px-4 py-3.5 font-medium text-slate-800">
                          {item.developerName}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                          {item.developerPhone}
                        </td>

                        {/* فیلد انتخاب Step */}
                        <td className="px-4 py-3.5">
                          <select
                            value={item.step || 1}
                            disabled={pending}
                            onChange={(e) =>
                              handleStepChange(item.id, e.target.value)
                            }
                            className="w-36 rounded-xl border border-orange-300 bg-orange-50/60 px-2.5 py-1.5 text-xs font-semibold text-sky-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-400/30"
                          >
                            {STEP_OPTIONS.map((step) => (
                              <option
                                key={step.value}
                                value={step.value}
                                className="bg-white text-slate-800"
                              >
                                {step.label}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap items-center justify-center gap-1.5">
                            {/* ریدایرکت به فرم جدید ورک‌فلو */}
                            <button
                              type="button"
                              onClick={() => {
                                setDetailsItem(item);
                                router.push(`/home/contract-development/${item.id}`);
                              }}
                              className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100 hover:border-sky-300 shadow-sm"
                            >
                              Contract Progress
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100 hover:border-amber-300 shadow-sm"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleDelete(item.id)}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 hover:border-rose-300 shadow-sm disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="10"
                        className="px-4 py-12 text-center text-sm text-slate-400"
                      >
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

      {showCreate ? (
        <ContractProjectFormModal
          title="Add Contract Development"
          submitText={pending ? "Creating..." : "Create Contract"}
          defaultValues={emptyForm}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editingItem ? (
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
      ) : null}
    </div>
  );
}

function ContractProjectFormModal({
  title,
  submitText,
  defaultValues,
  onClose,
  onSubmit,
}) {
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

  const getFieldClassName = (val, extraClasses = "") => {
    const isFilled = typeof val === "string" && val.trim() !== "";
    return `w-full rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200 ${
      isFilled
        ? "border border-slate-300 bg-white text-slate-800 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10"
        : "border border-amber-300 bg-amber-50/40 text-slate-800 placeholder:text-amber-700/40 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10"
    } ${extraClasses}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) {
      setErrorMessage(
        "لطفاً تمامی فیلدها را تکمیل نمایید. هیچ فیلدی نباید خالی باشد."
      );
      return;
    }

    const data = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      data.append(key, value.trim());
    });

    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/20">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/80 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-black tracking-wide text-slate-800">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        {errorMessage && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-4 p-6 md:grid-cols-2">
          {/* ۱. کد پروژه */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">
              Project Code <span className="text-rose-500">*</span>
            </label>
            <input
              name="projectCode"
              value={formData.projectCode}
              onChange={handleChange}
              placeholder="e.g. PRJ-MTX-01"
              className={getFieldClassName(formData.projectCode, "font-mono")}
            />
          </div>

          {/* ۲. عنوان پروژه */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">
              Project Title <span className="text-rose-500">*</span>
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Methotrexate Sterile Solution"
              className={getFieldClassName(formData.title)}
            />
          </div>

          {/* ۳. ماده مؤثره */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">
              API Name <span className="text-rose-500">*</span>
            </label>
            <input
              name="apiName"
              value={formData.apiName}
              onChange={handleChange}
              placeholder="e.g. Methotrexate Sodium"
              className={getFieldClassName(formData.apiName)}
            />
          </div>

          {/* ۴. شکل دارویی */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">
              Dosage Form <span className="text-rose-500">*</span>
            </label>
            <select
              name="dosageForm"
              value={formData.dosageForm}
              onChange={handleChange}
              className={getFieldClassName(
                formData.dosageForm,
                "cursor-pointer"
              )}
            >
              <option value="Solution">Solution</option>
              <option value="Solid">Solid</option>
              <option value="Semisolid">Semisolid</option>
              <option value="Lyophilized Powder">Lyophilized Powder</option>
              <option value="Suppository">Suppository</option>
              <option value="Ointment/Cream">Ointment/Cream</option>
            </select>
          </div>

          {/* ۵. قدرت و دوز */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 ml-1">
              Strength / Concentration <span className="text-rose-500">*</span>
            </label>
            <input
              name="strength"
              value={formData.strength}
              onChange={handleChange}
              placeholder="e.g. 50 mg/2 mL (25 mg/mL)"
              className={getFieldClassName(formData.strength)}
            />
          </div>

          {/* ۶. نام توسعه‌دهنده */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">
              Developer Name <span className="text-rose-500">*</span>
            </label>
            <input
              name="developerName"
              value={formData.developerName}
              onChange={handleChange}
              placeholder="e.g. Dr. Enteshari"
              className={getFieldClassName(formData.developerName)}
            />
          </div>

          {/* ۷. شماره تماس */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 ml-1">
              Developer Phone <span className="text-rose-500">*</span>
            </label>
            <input
              name="developerPhone"
              value={formData.developerPhone}
              onChange={handleChange}
              placeholder="0912..."
              className={getFieldClassName(
                formData.developerPhone,
                "font-mono"
              )}
            />
          </div>

          {/* ۸. مرحله پروژه (Step) */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 ml-1">
              Current Step <span className="text-rose-500">*</span>
            </label>
            <select
              name="step"
              value={formData.step}
              onChange={handleChange}
              className={getFieldClassName(formData.step, "cursor-pointer")}
            >
              {STEP_OPTIONS.map((step) => (
                <option key={step.value} value={step.value}>
                  {step.label}
                </option>
              ))}
            </select>
          </div>

          {/* دکمه‌های تایید/لغو */}
          <div className="md:col-span-2 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 mt-2">
            <div className="text-xs text-slate-400 flex items-center gap-3 self-start sm:self-center"></div>

            <div className="flex w-full sm:w-auto justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!isFormValid}
                className={`rounded-xl px-6 py-2.5 text-sm font-bold text-white shadow-md transition-all ${
                  isFormValid
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20 hover:scale-[1.01] cursor-pointer"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
              >
                {submitText}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
