"use client";

import { useEffect, useMemo, useState } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

import { getContractBatchesByProjectIdAction } from "@/app/actions/contract-batch-actions";
import { getContractSpecificationByProjectIdAction } from "@/app/actions/contract-specification-actions";
import { getContractResultsAction } from "@/app/actions/contract-result-actions";

const STABILITY_MONTHS = [0, 3, 6, 9, 12, 18, 24, 30, 36];
const ALL_PARAMETERS_KEY = "__all__";

const BASE_NUMERIC_PARAMETERS = [
  {
    key: "assay",
    label: "Assay (%)",
    resultKey: "assay",
    specMinKeys: ["assayMin", "assay_min", "minAssay", "assay_Min"],
    specMaxKeys: ["assayMax", "assay_max", "maxAssay", "assay_Max"],
    unit: "%",
  },
  {
    key: "pH",
    label: "pH",
    resultKey: "pH",
    // پشتیبانی کامل از تمام حالت‌های نام‌گذاری pH در دیتابیس
    specMinKeys: ["pHMin", "phMin", "ph_min", "pH_min", "minPH", "minPh"],
    specMaxKeys: ["pHMax", "phMax", "ph_max", "pH_max", "maxPH", "maxPh"],
    unit: "",
  },
  {
    key: "osmolarity",
    label: "Osmolarity (mOsmol/L)",
    resultKey: "osmolarity",
    specMinKeys: ["osmolarityMin", "osmolarity_min", "minOsmolarity"],
    specMaxKeys: ["osmolarityMax", "osmolarity_max", "maxOsmolarity"],
    unit: "mOsmol/L",
  },
  {
    key: "endotoxin",
    label: "Endotoxin (EU/mL)",
    resultKey: "endotoxin",
    specValueKeys: ["endotoxin", "endotoxinMax", "bacterialEndotoxin", "nmtEndotoxin"],
    unit: "EU/mL",
  },
  {
    key: "particulatedMater25",
    label: "Particulate Matter ≥ 25 µm",
    resultKey: "particulatedMater25",
    specValueKeys: ["particulatedMater25", "particulateMatter25", "particulated_mater_25"],
    unit: "particles",
  },
  {
    key: "particulatedMater10",
    label: "Particulate Matter ≥ 10 µm",
    resultKey: "particulatedMater10",
    specValueKeys: ["particulatedMater10", "particulateMatter10", "particulated_mater_10"],
    unit: "particles",
  },
  {
    key: "uniformityOfDosage",
    label: "Uniformity Of Dosage (AV)",
    resultKey: "uniformityOfDosage",
    specValueKeys: ["uniformityOfDosage", "uniformityOfDosageUnits", "uniformity"],
    unit: "AV",
  },
];

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

// تابع جستجوی امن مقدار از میان کلیدهای مختلف
function getSpecValue(spec, keys = []) {
  if (!spec) return null;
  for (const k of keys) {
    const val = toNumber(spec[k]);
    if (val !== null) return val;
  }
  return null;
}

function makeChartOptions({
  chartType,
  months,
  parameter,
  batch,
  condition,
  specification,
  seriesData,
}) {
  const plotLines = [];

  let min = null;
  let max = null;
  let val = null;

  if (parameter.isImpurity) {
    // استخراج حد مجاز ناخالصی از جدول مشخصات پروژه
    const specImps =
      specification?.impurities ||
      specification?.ContractSpecImpurity ||
      specification?.specImpurities ||
      specification?.contractSpecImpurities ||
      [];

    const matchedImp = specImps.find(
      (si) =>
        si?.name?.trim().toLowerCase() === parameter.impurityName?.toLowerCase() ||
        si?.impurityName?.trim().toLowerCase() === parameter.impurityName?.toLowerCase()
    );

    if (matchedImp) {
      val = toNumber(
        matchedImp.limit ??
        matchedImp.nmtLimit ??
        matchedImp.maxLimit ??
        matchedImp.value ??
        matchedImp.maxValue ??
        matchedImp.threshold
      );
    }
  } else {
    min = getSpecValue(specification, parameter.specMinKeys);
    max = getSpecValue(specification, parameter.specMaxKeys);
    val = getSpecValue(specification, parameter.specValueKeys);
  }

  if (min !== null) {
    plotLines.push({
      color: "#e11d48",
      width: 2,
      value: min,
      dashStyle: "Dash",
      label: {
        text: `Spec Min: ${min} ${parameter.unit || ""}`.trim(),
        align: "right",
        style: { color: "#e11d48", fontWeight: "bold", fontSize: "11px" },
      },
      zIndex: 4,
    });
  }

  if (max !== null) {
    plotLines.push({
      color: "#e11d48",
      width: 2,
      value: max,
      dashStyle: "Dash",
      label: {
        text: `Spec Max: ${max} ${parameter.unit || ""}`.trim(),
        align: "right",
        style: { color: "#e11d48", fontWeight: "bold", fontSize: "11px" },
      },
      zIndex: 4,
    });
  }

  if (val !== null) {
    plotLines.push({
      color: "#e11d48",
      width: 2,
      value: val,
      dashStyle: "Dash",
      label: {
        text: `Spec Limit: ${val} ${parameter.unit || ""}`.trim(),
        align: "right",
        style: { color: "#e11d48", fontWeight: "bold", fontSize: "11px" },
      },
      zIndex: 4,
    });
  }

  const batchTitle = batch?.batchNumber
    ? `Batch ${batch.batchNumber}`
    : `Batch #${batch?.id}`;

  return {
    chart: {
      height: 380,
      style: { fontFamily: "inherit" },
      backgroundColor: "transparent",
    },
    title: {
      text: `${parameter.label} - ${batchTitle}`,
      style: { fontWeight: "800", fontSize: "14px", color: "#1e293b" },
    },
    subtitle: {
      text:
        condition === "Accerator"
          ? "Accelerated Stability (40°C / 75% RH)"
          : "Long Term Stability (25°C / 60% RH)",
      style: { fontSize: "12px", color: "#64748b" },
    },
    xAxis: {
      categories: months.map((m) => `Month ${m}`),
      title: { text: "Stability Period", style: { color: "#64748b" } },
      crosshair: true,
      gridLineWidth: 1,
      gridLineColor: "#f8fafc",
    },
    yAxis: {
      title: {
        text: parameter.unit ? `Value (${parameter.unit})` : "Measured Value",
        style: { color: "#64748b" },
      },
      plotLines,
      gridLineColor: "#f1f5f9",
    },
    tooltip: {
      shared: true,
      useHTML: true,
      headerFormat:
        '<div style="font-size: 12px; font-weight: bold; margin-bottom: 4px;">{point.key}</div>',
      pointFormat:
        '<div style="color: {series.color}; font-size: 12px;">● {series.name}: <b>{point.y}</b> ' +
        (parameter.unit || "") +
        "</div>",
    },
    plotOptions: {
      column: {
        borderRadius: 6,
        borderWidth: 0,
        color: "#0284c7",
      },
      spline: {
        marker: { enabled: true, radius: 4 },
        color: "#0284c7",
      },
    },
    legend: { enabled: false },
    credits: { enabled: false },
    series: [
      {
        name: batchTitle,
        data: seriesData,
        type: chartType,
      },
    ],
  };
}

export default function ContractGraphTab({ projectId, projectDetails }) {
  const [batches, setBatches] = useState([]);
  const [specification, setSpecification] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedCondition, setSelectedCondition] = useState("Accerator");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedParameterKey, setSelectedParameterKey] = useState(ALL_PARAMETERS_KEY);
  const [chartType, setChartType] = useState("column");

  useEffect(() => {
    async function loadData() {
      const activeProjectId = projectId || projectDetails?.id;
      if (!activeProjectId) return;

      setLoading(true);
      try {
        const [batchesRes, specRes] = await Promise.all([
          getContractBatchesByProjectIdAction(activeProjectId),
          getContractSpecificationByProjectIdAction(activeProjectId),
        ]);

        const rawBatches = Array.isArray(batchesRes)
          ? batchesRes
          : batchesRes?.data || [];

        const batchesWithResults = await Promise.all(
          rawBatches.map(async (batch) => {
            if (batch.results && batch.results.length > 0) return batch;
            const resData = await getContractResultsAction(batch.id);
            const results = Array.isArray(resData)
              ? resData
              : resData?.data || [];
            return { ...batch, results };
          })
        );

        setBatches(batchesWithResults);

        if (batchesWithResults.length > 0) {
          setSelectedBatchId(String(batchesWithResults[0].id));
        }

        const specData = Array.isArray(specRes)
          ? specRes[0]
          : specRes?.data?.[0] || specRes?.data || specRes;
        setSpecification(specData || null);
      } catch (err) {
        console.error("Error loading stability graph data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId, projectDetails?.id]);

  const dynamicImpurityParameters = useMemo(() => {
    const impurityNames = new Set();

    batches.forEach((b) => {
      (b.results || []).forEach((r) => {
        (r.impurities || []).forEach((imp) => {
          if (imp?.name && toNumber(imp?.value) !== null) {
            impurityNames.add(imp.name.trim());
          }
        });
      });
    });

    return Array.from(impurityNames).map((name) => ({
      key: `impurity_${name}`,
      label: `Impurity: ${name} (%)`,
      isImpurity: true,
      impurityName: name,
      unit: "%",
    }));
  }, [batches]);

  const allParameters = useMemo(() => {
    return [...BASE_NUMERIC_PARAMETERS, ...dynamicImpurityParameters];
  }, [dynamicImpurityParameters]);

  const currentBatch = useMemo(() => {
    return (
      batches.find((b) => String(b.id) === String(selectedBatchId)) ||
      batches[0] ||
      null
    );
  }, [batches, selectedBatchId]);

  const parametersToRender = useMemo(() => {
    if (selectedParameterKey === ALL_PARAMETERS_KEY) return allParameters;
    const one = allParameters.find((p) => p.key === selectedParameterKey);
    return one ? [one] : [];
  }, [allParameters, selectedParameterKey]);

  const charts = useMemo(() => {
    if (!currentBatch || parametersToRender.length === 0) return [];

    return parametersToRender.map((parameter) => {
      const seriesData = STABILITY_MONTHS.map((m) => {
        const res = (currentBatch.results || []).find((r) => {
          const matchMonth = Number(r.month) === m;
          const matchCond =
            r.accelrator &&
            String(r.accelrator).toLowerCase() ===
              String(selectedCondition).toLowerCase();
          return matchMonth && matchCond;
        });

        if (!res) return null;

        if (parameter.isImpurity) {
          const imp = (res.impurities || []).find(
            (i) =>
              i.name?.trim().toLowerCase() ===
              parameter.impurityName.toLowerCase()
          );
          return toNumber(imp?.value);
        }

        // بررسی سازگاری pH و ph در خروجی نتایج
        if (parameter.key === "pH") {
          return toNumber(res.pH ?? res.ph);
        }

        return toNumber(res[parameter.resultKey]);
      });

      const options = makeChartOptions({
        chartType,
        months: STABILITY_MONTHS,
        parameter,
        batch: currentBatch,
        condition: selectedCondition,
        specification,
        seriesData,
      });

      return { key: parameter.key, parameter, options };
    });
  }, [chartType, currentBatch, parametersToRender, selectedCondition, specification]);

  if (loading) {
    return (
      <div className="flex min-h-[350px] items-center justify-center rounded-3xl border border-slate-200 bg-white p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-sky-500 border-t-transparent"></div>
          <span className="text-sm font-bold text-slate-600">
            Loading Contract Stability Data...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="ltr">
      {/* فیلترها و گزینه‌ها */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-800">
              Contract Stability Analysis
            </h3>
            <p className="text-xs text-slate-500">
              Select condition, batch and parameter(s) to evaluate stability trends.
            </p>
          </div>

          <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setChartType("column")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                chartType === "column"
                  ? "bg-white text-sky-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Bar Chart
            </button>
            <button
              type="button"
              onClick={() => setChartType("spline")}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                chartType === "spline"
                  ? "bg-white text-sky-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Trend Line
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Product Name
            </label>
            <div className="truncate rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-700">
              {projectDetails?.finishedProductName ||
                projectDetails?.projectName ||
                "Contract Project"}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Condition
            </label>
            <select
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              <option value="Accerator">Accelerated (40°C / 75% RH)</option>
              <option value="Long">Long Term (25°C / 60% RH)</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Batch
            </label>
            <select
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              disabled={batches.length === 0}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.batchNumber ? `Batch: ${b.batchNumber}` : `Batch #${b.id}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase text-slate-500">
              Parameter
            </label>
            <select
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
              value={selectedParameterKey}
              onChange={(e) => setSelectedParameterKey(e.target.value)}
            >
              <option value={ALL_PARAMETERS_KEY}>All Parameters</option>
              {allParameters.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ناحیه نمایش نمودارها */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        {!currentBatch ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            <p className="font-bold text-slate-700">No batch data available</p>
            <p className="mt-1 text-xs text-slate-400">
              Please register batches and results for this contract project first.
            </p>
          </div>
        ) : charts.length === 0 ? (
          <div className="flex min-h-[240px] items-center justify-center text-sm font-semibold text-slate-500">
            No parameters found to chart.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {charts.map((c) => (
              <div
                key={c.key}
                className="rounded-2xl border border-slate-200 bg-slate-50/40 p-3"
              >
                <HighchartsReact highcharts={Highcharts} options={c.options} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
