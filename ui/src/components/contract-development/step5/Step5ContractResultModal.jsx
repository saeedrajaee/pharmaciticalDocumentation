"use client";

import React, { useEffect, useMemo, useState, useTransition } from "react";
import { createContractResultAction } from "@/app/actions/contract-result-actions";

const ALLOWED_MONTHS = [0, 3, 6, 9, 12, 18, 24, 30, 36];

function toStringValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toBooleanValue(value) {
  if (value === true || value === false) return value;
  return "";
}

function normalizeMonth(value) {
  if (value === null || value === undefined || value === "") return "0";
  const num = Number(value);
  return ALLOWED_MONTHS.includes(num) ? String(num) : "0";
}

function parseOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function parseOptionalBoolean(value) {
  if (value === "" || value === null || value === undefined) return undefined;
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

// استخراج دقیق و جامع ناخالصی‌های تعریف‌شده از تمام روابط ممکن دیتابیس
function extractSpecImpurities(batch) {
  if (!batch) return [];

  // ۱. اگر ناخالصی‌ها مستقیماً روی batch وجود دارند
  if (Array.isArray(batch.impurities) && batch.impurities.length > 0) {
    return batch.impurities.map((imp) => ({
      specImpurityId: imp.specImpurityId || imp.id,
      name:
        imp.name ||
        imp.specImpurity?.name ||
        imp.impurityName ||
        "ناخالصی بدون نام",
      limit:
        imp.limit ??
        imp.nmtLimit ??
        imp.value ??
        imp.specImpurity?.limit ??
        imp.specImpurity?.value,
      value: "",
      description: imp.description || "",
    }));
  }

  // ۲. جمع‌آوری تمام Specification های احتمالی از مسیرهای مختلف
  const specs = [
    ...(Array.isArray(batch.project?.specifications)
      ? batch.project.specifications
      : []),
    ...(Array.isArray(batch.project?.ContractSpecification)
      ? batch.project.ContractSpecification
      : []),
    ...(Array.isArray(batch.specifications) ? batch.specifications : []),
    ...(batch.project?.specification ? [batch.project.specification] : []),
    ...(batch.specification ? [batch.specification] : []),
    ...(batch.stageSpecification ? [batch.stageSpecification] : []),
  ];

  // ۳. پیدا کردن Specification مطابق با مرحله (stage) بچ، در غیر این صورت اولین مورد
  let matchedSpec = null;
  if (specs.length > 0) {
    if (batch.stage) {
      matchedSpec = specs.find(
        (s) => String(s.stage).toUpperCase() === String(batch.stage).toUpperCase()
      );
    }
    if (!matchedSpec) {
      matchedSpec =
        specs.find((s) => s.isFinal || s.isFinalSpecification || s.isLatest) ||
        specs[0];
    }
  }

  // ۴. استخراج لیست ناخالصی‌ها از تمام نام‌های محتمل رابطه
  const impuritiesList =
    matchedSpec?.impurities ||
    matchedSpec?.ContractSpecImpurity ||
    matchedSpec?.specImpurities ||
    matchedSpec?.contractSpecImpurities ||
    batch.project?.impurities ||
    batch.project?.specImpurities ||
    [];

  // ۵. تبدیل به فرمت یکسان فرم — Set حذف موارد تکراری بر اساس specImpurityId
  const seen = new Set();
  return impuritiesList
    .map((imp) => ({
      specImpurityId: imp.specImpurityId || imp.id,
      name:
        imp.name ||
        imp.impurityName ||
        imp.impurity?.name ||
        imp.relatedSubstance ||
        "ناخالصی بدون نام",
      limit:
        imp.limit ??
        imp.nmtLimit ??
        imp.value ??
        imp.maxValue ??
        imp.threshold,
      value: "",
      description: imp.description || "",
    }))
    .filter((item) => {
      if (!item.specImpurityId) return true;
      if (seen.has(item.specImpurityId)) return false;
      seen.add(item.specImpurityId);
      return true;
    });
}

function createInitialForm(defaultValues = {}, batch) {
  const specImpurities = extractSpecImpurities(batch);

  let initialImpurities = [];
  if (defaultValues.impurities?.length > 0) {
    initialImpurities = defaultValues.impurities.map((item) => ({
      specImpurityId: item.specImpurityId || item.id,
      name: item.name || item.specImpurity?.name || "",
      limit:
        item.limit ??
        item.specImpurity?.limit ??
        item.specImpurity?.value ??
        undefined,
      value: toStringValue(item.value),
      description: item.description || "",
    }));
  } else if (specImpurities.length > 0) {
    initialImpurities = specImpurities;
  }

  return {
    accelrator: defaultValues.accelrator || "Accerator",
    month: normalizeMonth(defaultValues.month),

    appearance: toBooleanValue(defaultValues.appearance),
    identification1: toBooleanValue(defaultValues.identification1),
    identification2: toBooleanValue(defaultValues.identification2),
    clarity: toBooleanValue(defaultValues.clarity),
    sterility: toBooleanValue(defaultValues.sterility),
    leakTest: toBooleanValue(defaultValues.leakTest),

    endotoxin: toStringValue(defaultValues.endotoxin),
    particulatedMater25: toStringValue(defaultValues.particulatedMater25),
    particulatedMater10: toStringValue(defaultValues.particulatedMater10),
    uniformityOfDosage: toStringValue(defaultValues.uniformityOfDosage),
    assay: toStringValue(defaultValues.assay),
    pH: toStringValue(defaultValues.pH),
    osmolarity: toStringValue(defaultValues.osmolarity),

    impurities: initialImpurities,
    batchId: toStringValue(defaultValues.batchId || batch?.id || ""),
  };
}

export default function ContractResultModal({
  isOpen,
  onClose,
  batch,
  onSuccess,
}) {
  const [form, setForm] = useState(() => createInitialForm({}, batch));
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const batchKey = useMemo(() => {
    if (!batch) return "no-batch";
    return `${batch.id || "noid"}__${batch.stage || "nostage"}`;
  }, [batch]);

  useEffect(() => {
    if (batch?.id && isOpen) {
      setForm(createInitialForm({}, batch));
      setErrorMsg("");
    }
  }, [batchKey, batch?.id, isOpen]);

  if (!isOpen || !batch) return null;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleBooleanChange(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? "" : value === "true",
    }));
  }

  function handleImpurityValueChange(index, value) {
    setForm((prev) => ({
      ...prev,
      impurities: prev.impurities.map((item, i) =>
        i === index ? { ...item, value } : item
      ),
    }));
  }

  function buildPayload(currentForm) {
    return {
      batchId: Number(currentForm.batchId),
      accelrator: currentForm.accelrator,
      month: Number(currentForm.month),

      appearance: parseOptionalBoolean(currentForm.appearance),
      identification1: parseOptionalBoolean(currentForm.identification1),
      identification2: parseOptionalBoolean(currentForm.identification2),
      clarity: parseOptionalBoolean(currentForm.clarity),
      sterility: parseOptionalBoolean(currentForm.sterility),
      leakTest: parseOptionalBoolean(currentForm.leakTest),

      endotoxin: parseOptionalNumber(currentForm.endotoxin),
      particulatedMater25: parseOptionalNumber(currentForm.particulatedMater25),
      particulatedMater10: parseOptionalNumber(currentForm.particulatedMater10),
      uniformityOfDosage: parseOptionalNumber(currentForm.uniformityOfDosage),
      assay: parseOptionalNumber(currentForm.assay),
      pH: parseOptionalNumber(currentForm.pH),
      osmolarity: parseOptionalNumber(currentForm.osmolarity),

      impurities: (currentForm.impurities || [])
        .map((it) => ({
          specImpurityId: it.specImpurityId
            ? Number(it.specImpurityId)
            : undefined,
          id: it.specImpurityId ? Number(it.specImpurityId) : undefined,
          name: it.name,
          value: parseOptionalNumber(it.value),
          description: it.description || undefined,
        }))
        .filter((it) => it.value !== undefined),
    };
  }

  function handleSubmit(e) {
    e.preventDefault();
    setErrorMsg("");

    if (!form.batchId) {
      setErrorMsg("شناسه Batch مشخص نیست.");
      return;
    }

    const monthNum = Number(form.month);
    if (isNaN(monthNum) || !ALLOWED_MONTHS.includes(monthNum)) {
      setErrorMsg("Time Point معتبر نیست.");
      return;
    }

    const payload = buildPayload(form);

    startTransition(async () => {
      try {
        const res = await createContractResultAction(payload);

        if (res?.error) {
          setErrorMsg(res.message || "خطا در ثبت نتایج تست پایداری");
          return;
        }

        setForm(createInitialForm({}, batch));
        if (typeof onSuccess === "function") {
          onSuccess();
        }
        if (typeof onClose === "function") {
          onClose();
        }
      } catch (err) {
        console.error("Save result error:", err);
        setErrorMsg("خطای غیرمنتظره در ارتباط با سرور رخ داد.");
      }
    });
  }

  const fieldClassName =
    "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200";

  const tableHeaderClass =
    "bg-slate-100 px-4 py-3 text-left text-sm font-black text-slate-800";
  const tableCellClass = "border-t border-slate-200 px-4 py-3 align-middle";
  const labelCellClass =
    "border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 align-middle";

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm"
      dir="ltr"
    >
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-300 bg-white shadow-2xl shadow-slate-300/40">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">
              Record Stability Test Results
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Batch:{" "}
              <span className="font-mono font-bold text-sky-600">
                {batch?.batchNumber}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            disabled={isPending}
          >
            Close
          </button>
        </div>

        {/* Error Feedback */}
        {errorMsg && (
          <div className="mx-6 mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="grid gap-6 p-6">
          {/* Storage Condition & Month */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Storage Condition *
              </label>
              <select
                name="accelrator"
                value={form.accelrator}
                onChange={handleChange}
                className={fieldClassName}
              >
                <option value="Accerator">
                  Accelerate (40°C ± 2°C / 75% RH ± 5%)
                </option>
                <option value="Long">Long (25°C ± 2°C / 60% RH ± 5%)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-slate-700">
                Time Point *
              </label>
              <select
                name="month"
                value={form.month}
                onChange={handleChange}
                className={fieldClassName}
              >
                {ALLOWED_MONTHS.map((m) => (
                  <option key={m} value={String(m)}>
                    Month {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Qualitative Tests Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-300">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Test</th>
                  <th className={tableHeaderClass}>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={labelCellClass}>Appearance</td>
                  <td className={tableCellClass}>
                    <select
                      value={form.appearance === "" ? "" : String(form.appearance)}
                      onChange={(e) =>
                        handleBooleanChange("appearance", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Select result</option>
                      <option value="true">Pass</option>
                      <option value="false">Fail</option>
                    </select>
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Identification 1</td>
                  <td className={tableCellClass}>
                    <select
                      value={
                        form.identification1 === ""
                          ? ""
                          : String(form.identification1)
                      }
                      onChange={(e) =>
                        handleBooleanChange("identification1", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Select result</option>
                      <option value="true">Pass</option>
                      <option value="false">Fail</option>
                    </select>
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Identification 2</td>
                  <td className={tableCellClass}>
                    <select
                      value={
                        form.identification2 === ""
                          ? ""
                          : String(form.identification2)
                      }
                      onChange={(e) =>
                        handleBooleanChange("identification2", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Select result</option>
                      <option value="true">Pass</option>
                      <option value="false">Fail</option>
                    </select>
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Clarity</td>
                  <td className={tableCellClass}>
                    <select
                      value={form.clarity === "" ? "" : String(form.clarity)}
                      onChange={(e) =>
                        handleBooleanChange("clarity", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Select result</option>
                      <option value="true">Pass</option>
                      <option value="false">Fail</option>
                    </select>
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Sterility</td>
                  <td className={tableCellClass}>
                    <select
                      value={
                        form.sterility === "" ? "" : String(form.sterility)
                      }
                      onChange={(e) =>
                        handleBooleanChange("sterility", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Select result</option>
                      <option value="true">Pass</option>
                      <option value="false">Fail</option>
                    </select>
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Leak Test</td>
                  <td className={tableCellClass}>
                    <select
                      value={form.leakTest === "" ? "" : String(form.leakTest)}
                      onChange={(e) =>
                        handleBooleanChange("leakTest", e.target.value)
                      }
                      className={fieldClassName}
                    >
                      <option value="">Select result</option>
                      <option value="true">Pass</option>
                      <option value="false">Fail</option>
                    </select>
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>NMT endotoxin (EU/mL)</td>
                  <td className={tableCellClass}>
                    <input
                      name="endotoxin"
                      type="number"
                      step="any"
                      value={form.endotoxin}
                      onChange={handleChange}
                      placeholder="0.25"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>
                    NMT Particulate Matter ≥ 25 µm
                  </td>
                  <td className={tableCellClass}>
                    <input
                      name="particulatedMater25"
                      type="number"
                      step="any"
                      value={form.particulatedMater25}
                      onChange={handleChange}
                      placeholder="6000"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>
                    NMT Particulate Matter ≥ 10 µm
                  </td>
                  <td className={tableCellClass}>
                    <input
                      name="particulatedMater10"
                      type="number"
                      step="any"
                      value={form.particulatedMater10}
                      onChange={handleChange}
                      placeholder="600"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Uniformity Of Dosage (AV)</td>
                  <td className={tableCellClass}>
                    <input
                      name="uniformityOfDosage"
                      type="number"
                      step="any"
                      max="15"
                      value={form.uniformityOfDosage}
                      onChange={handleChange}
                      placeholder="15"
                      className={fieldClassName}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quantitative Tests Table */}
          <div className="overflow-hidden rounded-2xl border border-slate-300">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Test</th>
                  <th className={tableHeaderClass}>Result</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={labelCellClass}>Assay (%)</td>
                  <td className={tableCellClass}>
                    <input
                      name="assay"
                      type="number"
                      step="any"
                      value={form.assay}
                      onChange={handleChange}
                      placeholder="100"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>pH</td>
                  <td className={tableCellClass}>
                    <input
                      name="pH"
                      type="number"
                      step="any"
                      value={form.pH}
                      onChange={handleChange}
                      placeholder="4.5"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Osmolarity (mOsmol/L)</td>
                  <td className={tableCellClass}>
                    <input
                      name="osmolarity"
                      type="number"
                      step="any"
                      value={form.osmolarity}
                      onChange={handleChange}
                      placeholder="290"
                      className={fieldClassName}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Impurities Card */}
          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Impurities / Related Substances
                </h3>
                <p className="text-xs text-slate-500">
                  Specified in Contract Specification
                </p>
              </div>
            </div>

            {form.impurities.length === 0 ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
                هیچ ناخالصی در مشخصات نهایی (Specification) این پروژه تعریف نشده است.
              </div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className={tableHeaderClass}>Impurity Name</th>
                      <th className={tableHeaderClass}>Limit (NMT %)</th>
                      <th className={tableHeaderClass}>Measured Result (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.impurities.map((item, index) => (
                      <tr key={item.specImpurityId || index}>
                        <td
                          className={`${tableCellClass} font-semibold text-slate-800`}
                        >
                          {item.name}
                        </td>

                        <td className={`${tableCellClass} text-slate-500`}>
                          {item.limit !== undefined && item.limit !== null
                            ? `≤ ${item.limit}%`
                            : "—"}
                        </td>

                        <td className={tableCellClass}>
                          <input
                            type="number"
                            step="any"
                            value={item.value}
                            onChange={(e) =>
                              handleImpurityValueChange(index, e.target.value)
                            }
                            placeholder="e.g. 0.05"
                            className={fieldClassName}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <input
            type="hidden"
            name="batchId"
            value={batch.id || form.batchId}
            readOnly
          />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition hover:from-sky-400 hover:to-indigo-400 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Test Result"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
