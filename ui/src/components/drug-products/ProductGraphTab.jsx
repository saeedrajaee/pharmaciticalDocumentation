"use client";

import { useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// ماه‌های استاندارد پایداری طبق لیست ALLOWED_MONTHS در فرم شما
const STABILITY_MONTHS = [0, 3, 6, 9, 12, 18, 24, 30, 36];

/**
 * نقشه پارامترهای عددی پروژه بر اساس فیلدهای Result و Specification شما
 */
const NUMERIC_PARAMETERS = [
  {
    key: "assay",
    label: "Assay",
    resultKey: "assay",
    specMinKey: "assayMin",
    specMaxKey: "assayMax",
  },
  {
    key: "pH",
    label: "pH",
    resultKey: "pH",
    specMinKey: "pHMin",
    specMaxKey: "pHMax",
  },
  {
    key: "osmolarity",
    label: "Osmolarity",
    resultKey: "osmolarity",
    specMinKey: "osmolarityMin",
    specMaxKey: "osmolarityMax",
  },
  {
    key: "endotoxin",
    label: "Endotoxin",
    resultKey: "endotoxin",
    specValueKey: "endotoxin", // فیلد تک مقداری NMT در Spec
  },
  {
    key: "particulatedMater25",
    label: "Particulate Matter 25 µm",
    resultKey: "particulatedMater25",
    specValueKey: "particulatedMater25",
  },
  {
    key: "particulatedMater10",
    label: "Particulate Matter 10 µm",
    resultKey: "particulatedMater10",
    specValueKey: "particulatedMater10",
  },
  {
    key: "uniformityOfDosage",
    label: "Uniformity Of Dosage",
    resultKey: "uniformityOfDosage",
    specValueKey: "uniformityOfDosage",
  },
];

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * استخراج اولین Specification معتبر از محصول
 */
function getProductSpecification(productDetails) {
  const specs = productDetails?.specification;
  if (!specs) return null;
  return Array.isArray(specs) ? specs[0] : specs;
}

export default function ProductGraphTab({ productDetails }) {
  const specification = useMemo(() => getProductSpecification(productDetails), [productDetails]);
  const batches = productDetails?.batches || [];

  const [selectedBatchId, setSelectedBatchId] = useState(batches[0]?.id || "");
  const [selectedParameterKey, setSelectedParameterKey] = useState("all");

  const selectedBatch = useMemo(
    () => batches.find((b) => String(b.id) === String(selectedBatchId)) || null,
    [batches, selectedBatchId]
  );

  // فیلتر پارامترهایی که در این بچ حداقل یک داده عددی دارند
  const availableParameters = useMemo(() => {
    if (!selectedBatch) return [];
    return NUMERIC_PARAMETERS.filter((param) =>
      (selectedBatch.results || []).some((r) => toNumber(r[param.resultKey]) !== null)
    );
  }, [selectedBatch]);

  const renderList = useMemo(() => {
    if (selectedParameterKey === "all") return availableParameters;
    return availableParameters.filter((p) => p.key === selectedParameterKey);
  }, [availableParameters, selectedParameterKey]);

  return (
    <div className="space-y-6">
      {/* بخش فیلترها */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Drug Name</label>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
              {productDetails?.finishedProductName || "N/A"}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Select Batch</label>
            <select
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber || `Batch ID: ${b.id}`}
                </option>
              ))}
              {!batches.length && <option>No Batches Available</option>}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase text-slate-500">Parameter</label>
            <select
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-500"
              value={selectedParameterKey}
              onChange={(e) => setSelectedParameterKey(e.target.value)}
            >
              <option value="all">All Parameters</option>
              {availableParameters.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* بخش نمایش نمودارها */}
      <div className="grid gap-6">
        {selectedBatch && renderList.length > 0 ? (
          renderList.map((param) => {
            // استخراج مقادیر بر اساس ماه
            const dataPoints = STABILITY_MONTHS.map((m) => {
              const res = (selectedBatch.results || []).find((r) => Number(r.month) === m);
              return toNumber(res?.[param.resultKey]);
            });

            // تنظیم خطوط راهنمای Spec (قرمز)
            const plotLines = [];
            const min = toNumber(specification?.[param.specMinKey]);
            const max = toNumber(specification?.[param.specMaxKey]);
            const val = toNumber(specification?.[param.specValueKey]);

            if (min !== null) plotLines.push({ color: "red", width: 2, value: min, dashStyle: "dash", label: { text: `Min: ${min}`, align: "right", style: { color: "red" } }, zIndex: 5 });
            if (max !== null) plotLines.push({ color: "red", width: 2, value: max, dashStyle: "dash", label: { text: `Max: ${max}`, align: "right", style: { color: "red" } }, zIndex: 5 });
            if (val !== null) plotLines.push({ color: "red", width: 2, value: val, dashStyle: "dash", label: { text: `Limit: ${val}`, align: "right", style: { color: "red" } }, zIndex: 5 });

            const options = {
              chart: { type: "column", height: 350, style: { fontFamily: "inherit" } },
              title: { text: param.label, style: { fontWeight: "bold" } },
              xAxis: { categories: STABILITY_MONTHS.map(m => `Month ${m}`), title: { text: "Stability Period" } },
              yAxis: { title: { text: "Measured Value" }, plotLines },
              series: [{ name: param.label, data: dataPoints, color: "#0ea5e9" }],
              credits: { enabled: false },
              tooltip: { shared: true, valueSuffix: " " }
            };

            return (
              <div key={param.key} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <HighchartsReact highcharts={Highcharts} options={options} />
              </div>
            );
          })
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-slate-500">
            <p className="font-semibold">No stability data found for the selected criteria.</p>
            <p className="text-xs">Ensure you have added Results to this batch with numeric values.</p>
          </div>
        )}
      </div>
    </div>
  );
}
