"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createContractSpecificationAction,
  deleteContractSpecificationAction,
  getContractSpecificationByProjectIdAction,
  updateContractSpecificationAction,
} from "@/app/actions/contract-specification-actions";

const isActionError = (res) => res?.error === true || res?.success === false;

const getActionMessage = (res, fallback) => {
  if (res?.message) return res.message;
  if (res?.details) {
    const firstErr = Object.values(res.details)?.[0]?.[0];
    if (firstErr) return firstErr;
  }
  return fallback;
};

function formatImpurities(impurities) {
  if (!Array.isArray(impurities) || !impurities.length) return "-";

  return impurities
    .map((item) => {
      const name = item?.name || "-";
      const value = item?.value !== null && item?.value !== undefined ? item.value : "-";
      const description = item?.description ? ` (${item.description})` : "";
      return `${name}: ${value}${description}`;
    })
    .join(" , ");
}

const initialFormState = {
  descriptionAppearance: "",
  identification1: "",
  identification2: "",
  assayMin: "",
  assayMax: "",
  pHMin: "",
  pHMax: "",
  clarity: "",
  particulatedMater25: "",
  particulatedMater10: "",
  sterility: "",
  leakTest: "",
  endotoxin: "",
  osmolarityMin: "",
  osmolarityMax: "",
  preservativeContent: "",
  uniformityOfDosage: 15.0,
  impurities: [],
};

export default function ContractSpecificationStep({
  projectId,
  onDataStatusChange,
}) {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [spec, setSpec] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  // گزارش وضعیت پر بودن/خالی بودن رکورد به کامپوننت والد
  useEffect(() => {
    if (mounted && !loading) {
      onDataStatusChange?.(Boolean(spec?.id));
    }
  }, [spec, mounted, loading, onDataStatusChange]);

  const loadData = async () => {
    if (!projectId) {
      setSpec(null);
      setLoading(false);
      onDataStatusChange?.(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getContractSpecificationByProjectIdAction(Number(projectId));
      if (res && !isActionError(res)) {
        const data = Array.isArray(res) ? res[0] : res?.data || res;
        setSpec(data?.id ? data : null);
      } else {
        setSpec(null);
      }
    } catch (err) {
      console.error("Error loading Contract Specification:", err);
      setSpec(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [projectId, mounted]);

  const handleOpenAddModal = () => {
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (currentSpec) => {
    setFormData({
      descriptionAppearance: currentSpec.descriptionAppearance ?? "",
      identification1: currentSpec.identification1 ?? "",
      identification2: currentSpec.identification2 ?? "",
      assayMin: currentSpec.assayMin ?? "",
      assayMax: currentSpec.assayMax ?? "",
      pHMin: currentSpec.pHMin ?? "",
      pHMax: currentSpec.pHMax ?? "",
      clarity: currentSpec.clarity ?? "",
      particulatedMater25: currentSpec.particulatedMater25 ?? "",
      particulatedMater10: currentSpec.particulatedMater10 ?? "",
      sterility: currentSpec.sterility ?? "",
      leakTest: currentSpec.leakTest ?? "",
      endotoxin: currentSpec.endotoxin ?? "",
      osmolarityMin: currentSpec.osmolarityMin ?? "",
      osmolarityMax: currentSpec.osmolarityMax ?? "",
      preservativeContent: currentSpec.preservativeContent ?? "",
      uniformityOfDosage: currentSpec.uniformityOfDosage ?? 15.0,
      impurities: Array.isArray(currentSpec.impurities)
        ? currentSpec.impurities.map((imp) => ({
            id: imp.id,
            name: imp.name ?? "",
            value: imp.value ?? "",
            description: imp.description ?? "",
          }))
        : [],
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    if (!isPending) {
      setIsModalOpen(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImpurityRow = () => {
    setFormData((prev) => ({
      ...prev,
      impurities: [...prev.impurities, { name: "", value: "", description: "" }],
    }));
  };

  const handleRemoveImpurityRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      impurities: prev.impurities.filter((_, i) => i !== index),
    }));
  };

  const handleImpurityChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.impurities];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, impurities: updated };
    });
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const toNumOrNull = (val) =>
          val === "" || val === null || isNaN(val) ? null : Number(val);
        const toStrOrNull = (val) =>
          val && String(val).trim() !== "" ? String(val).trim() : null;

        const payload = {
          projectId: Number(projectId),
          descriptionAppearance: toStrOrNull(formData.descriptionAppearance),
          identification1: toStrOrNull(formData.identification1),
          identification2: toStrOrNull(formData.identification2),
          assayMin: toNumOrNull(formData.assayMin),
          assayMax: toNumOrNull(formData.assayMax),
          pHMin: toNumOrNull(formData.pHMin),
          pHMax: toNumOrNull(formData.pHMax),
          clarity: toStrOrNull(formData.clarity),
          particulatedMater25: toNumOrNull(formData.particulatedMater25),
          particulatedMater10: toNumOrNull(formData.particulatedMater10),
          sterility: toStrOrNull(formData.sterility),
          leakTest: toStrOrNull(formData.leakTest),
          endotoxin: toNumOrNull(formData.endotoxin),
          osmolarityMin: toNumOrNull(formData.osmolarityMin),
          osmolarityMax: toNumOrNull(formData.osmolarityMax),
          preservativeContent: toNumOrNull(formData.preservativeContent),
          uniformityOfDosage: toNumOrNull(formData.uniformityOfDosage),
          impurities: formData.impurities
            .filter((imp) => imp.name && imp.name.trim() !== "")
            .map((imp) => ({
              ...(imp.id ? { id: Number(imp.id) } : {}),
              name: imp.name.trim(),
              value: toNumOrNull(imp.value),
              description: toStrOrNull(imp.description),
            })),
        };

        let res;
        if (spec?.id) {
          res = await updateContractSpecificationAction(Number(spec.id), payload);
        } else {
          res = await createContractSpecificationAction(payload);
        }

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to save specification."));
          return;
        }

        setIsModalOpen(false);
        await loadData();
      } catch (err) {
        console.error("Error saving specification:", err);
        alert("An error occurred while saving the specification.");
      }
    });
  };

  const handleDelete = (id) => {
    if (!id) return;
    if (!window.confirm("Are you sure you want to delete this specification?")) return;

    startTransition(async () => {
      try {
        const res = await deleteContractSpecificationAction(Number(id), Number(projectId));
        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to delete specification."));
          return;
        }
        await loadData();
      } catch (err) {
        console.error("Error deleting specification:", err);
        alert("An error occurred while deleting the record.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
        Loading Specifications...
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="ltr">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-800">
            Stability Specifications
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage the stability specifications for this product
          </p>
        </div>

        {!spec && !loading && (
          <button
            type="button"
            onClick={handleOpenAddModal}
            disabled={isPending || !projectId}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:from-sky-400 hover:to-indigo-400 active:scale-95 disabled:opacity-50"
          >
            Add Specification
          </button>
        )}
      </div>

      {/* Main Table / Record Presentation */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500">
            <svg className="h-5 w-5 animate-spin text-sky-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Loading specification data...
          </div>
        ) : !spec ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No specifications found for this product
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
              <span className="text-sm font-bold text-slate-700">
                Specification #1
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                >
                  {isExpanded ? "Hide Details" : "Details"}
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEditModal(spec)}
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                >
                  Edit
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(spec.id)}
                  className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-slate-100 bg-white p-6">
                <div className="overflow-hidden rounded-2xl border border-slate-300">
                  <table className="w-full border-collapse table-fixed">
                    <thead>
                      <tr>
                        <th className="w-1/2 bg-slate-100 px-4 py-3 text-left text-sm font-black text-slate-800">
                          Test
                        </th>
                        <th className="w-1/2 bg-slate-100 px-4 py-3 text-left text-sm font-black text-slate-800">
                          Acceptance Limit
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Appearance Description
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.descriptionAppearance || "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Identification 1
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.identification1 || "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Identification 2
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.identification2 || "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Clarity
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.clarity || "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Sterility
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.sterility || "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Leak Test
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.leakTest || "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          NMT endotoxin
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.endotoxin ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          NMT Particulat Matter 25 um
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.particulatedMater25 ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          NMT Particulat Matter 10 um
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.particulatedMater10 ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          NMT Preservative Content
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.preservativeContent ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Uniformity Of Dosage
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.uniformityOfDosage ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Assay Min
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.assayMin ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          Assay Max
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.assayMax ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          pH Min
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.pHMin ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          pH Max
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.pHMax ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Osmolarity Min
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.osmolarityMin ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          Osmolarity Max
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {spec.osmolarityMax ?? "-"}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
                          Impurities
                        </td>
                        <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-800">
                          {formatImpurities(spec.impurities)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tailwind Pure Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col rounded-3xl bg-white shadow-2xl transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h4 className="text-base font-bold text-slate-800">
                  {spec ? "Edit Stability Specification" : "Add Stability Specification"}
                </h4>
                <p className="text-xs text-slate-500">Project #{projectId}</p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isPending}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto p-6 text-xs md:text-sm text-slate-700">
              <div>
                <h5 className="mb-3 font-bold text-slate-900 border-b border-slate-200 pb-1.5">
                  General & Physicochemical Tests
                </h5>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Appearance Description</label>
                    <input
                      type="text"
                      value={formData.descriptionAppearance}
                      onChange={(e) => handleInputChange("descriptionAppearance", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Identification 1</label>
                    <input
                      type="text"
                      value={formData.identification1}
                      onChange={(e) => handleInputChange("identification1", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Identification 2</label>
                    <input
                      type="text"
                      value={formData.identification2}
                      onChange={(e) => handleInputChange("identification2", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Clarity</label>
                    <input
                      type="text"
                      value={formData.clarity}
                      onChange={(e) => handleInputChange("clarity", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Sterility</label>
                    <input
                      type="text"
                      value={formData.sterility}
                      onChange={(e) => handleInputChange("sterility", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Leak Test</label>
                    <input
                      type="text"
                      value={formData.leakTest}
                      onChange={(e) => handleInputChange("leakTest", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Assay Min (%)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.assayMin}
                      onChange={(e) => handleInputChange("assayMin", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Assay Max (%)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.assayMax}
                      onChange={(e) => handleInputChange("assayMax", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">pH Min</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pHMin}
                      onChange={(e) => handleInputChange("pHMin", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">pH Max</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.pHMax}
                      onChange={(e) => handleInputChange("pHMax", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">NMT Endotoxin (EU/ml)</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.endotoxin}
                      onChange={(e) => handleInputChange("endotoxin", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">NMT Particulate Matter 10 um</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.particulatedMater10}
                      onChange={(e) => handleInputChange("particulatedMater10", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">NMT Particulate Matter 25 um</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.particulatedMater25}
                      onChange={(e) => handleInputChange("particulatedMater25", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Osmolarity Min</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.osmolarityMin}
                      onChange={(e) => handleInputChange("osmolarityMin", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Osmolarity Max</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.osmolarityMax}
                      onChange={(e) => handleInputChange("osmolarityMax", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">NMT Preservative Content</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.preservativeContent}
                      onChange={(e) => handleInputChange("preservativeContent", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block font-medium text-slate-600">Uniformity Of Dosage</label>
                    <input
                      type="number"
                      step="any"
                      value={formData.uniformityOfDosage}
                      onChange={(e) => handleInputChange("uniformityOfDosage", e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <h5 className="font-bold text-slate-900">Impurities (Related Substances)</h5>
                  <button
                    type="button"
                    onClick={handleAddImpurityRow}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-slate-700"
                  >
                    + Add Impurity Row
                  </button>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700">
                      <tr>
                        <th className="px-3 py-2.5 font-bold">Impurity Name *</th>
                        <th className="w-36 px-3 py-2.5 font-bold">Limit (%)</th>
                        <th className="px-3 py-2.5 font-bold">Description</th>
                        <th className="w-16 px-3 py-2.5 text-center font-bold">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {formData.impurities.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-4 text-center text-slate-400">
                            No impurities added yet. Click &quot;+ Add Impurity Row&quot; above.
                          </td>
                        </tr>
                      ) : (
                        formData.impurities.map((imp, idx) => (
                          <tr key={idx}>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="e.g. Impurity A"
                                value={imp.name}
                                onChange={(e) => handleImpurityChange(idx, "name", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                step="any"
                                placeholder="0.2"
                                value={imp.value}
                                onChange={(e) => handleImpurityChange(idx, "value", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                placeholder="Optional details"
                                value={imp.description}
                                onChange={(e) => handleImpurityChange(idx, "description", e.target.value)}
                                className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 focus:border-sky-500 focus:outline-none"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveImpurityRow(idx)}
                                className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                                title="Remove"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isPending}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2 text-xs font-bold text-white transition hover:from-sky-400 hover:to-indigo-400 active:scale-95 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Specification"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
