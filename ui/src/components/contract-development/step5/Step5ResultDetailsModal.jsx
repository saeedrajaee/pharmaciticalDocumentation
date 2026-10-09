"use client";

import React from "react";

// تبدیل ایمن مقدار به عدد
function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

// نرمال‌سازی مقادیر شبه‌بولین
function normalizeBooleanLike(value) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

// وضعیت برای تست‌های باینری / کیفی
function getBooleanStatus(value) {
  const normalized = normalizeBooleanLike(value);

  if (normalized === null) {
    return { label: "N/A", passed: null };
  }

  return normalized
    ? { label: "Pass", passed: true }
    : { label: "Fail", passed: false };
}

// وضعیت برای تست‌های دامنه‌ای (Min - Max)
function getRangeStatus(value, min, max) {
  const current = toNumber(value);
  const minValue = toNumber(min);
  const maxValue = toNumber(max);

  if (current === null || minValue === null || maxValue === null) {
    return { label: "N/A", passed: null };
  }

  const passed = current >= minValue && current <= maxValue;
  return { label: passed ? "Pass" : "Fail", passed };
}

// وضعیت برای تست‌های حداکثری (Upper Limit / NMT)
function getLessThanStatus(value, max) {
  const current = toNumber(value);
  const maxValue = toNumber(max);

  if (current === null || maxValue === null) {
    return { label: "N/A", passed: null };
  }

  const passed = current <= maxValue;
  return { label: passed ? "Pass" : "Fail", passed };
}

// وضعیت برای یکنواختی دوز (Uniformity of Dosage Units)
function getUniformityStatus(value) {
  const current = toNumber(value);

  if (current === null) {
    return { label: "N/A", passed: null };
  }

  const passed = current < 15;
  return { label: passed ? "Pass" : "Fail", passed };
}

// استایل‌دهی بج وضعیت
function statusBadgeClass(passed) {
  if (passed === true) {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (passed === false) {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-500";
}

// استایل ردیف بر اساس نتیجه
function rowClass(passed) {
  if (passed === true) {
    return "border-t border-emerald-100 bg-emerald-50/40";
  }

  if (passed === false) {
    return "border-t border-rose-100 bg-rose-50/40";
  }

  return "border-t border-slate-200 bg-white";
}

// قالب‌بندی مقادیر نمایشی
function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (value === true || value === "true") return "Pass";
  if (value === false || value === "false") return "Fail";
  return String(value);
}

// قالب‌بندی نمایش بازه
function formatRange(min, max) {
  const minValue = formatValue(min);
  const maxValue = formatValue(max);

  if (minValue === "-" && maxValue === "-") return "-";
  return `${minValue} - ${maxValue}`;
}

// قالب‌بندی حد بالا
function formatMax(max) {
  const maxValue = formatValue(max);
  if (maxValue === "-") return "-";
  return `≤ ${maxValue}`;
}

// کامپوننت سطر جدول
function Row({ label, value, specValue, status }) {
  return (
    <tr className={rowClass(status?.passed)}>
      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{label}</td>
      <td className="px-4 py-3 text-sm text-slate-800">{formatValue(value)}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{specValue || "-"}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(
            status?.passed
          )}`}
        >
          {status?.label || "N/A"}
        </span>
      </td>
    </tr>
  );
}

export default function Step5ResultDetailsModal({
  result,
  specification,
  onClose,
}) {
  if (!result) return null;

  // ارزیابی تست‌های کیفی و ظاهری
  const appearanceStatus = getBooleanStatus(result.appearance);
  const identification1Status = getBooleanStatus(result.identification1);
  const identification2Status = getBooleanStatus(result.identification2);
  const clarityStatus = getBooleanStatus(result.clarity);
  const leakTestStatus = getBooleanStatus(result.leakTest ?? result.leak_test);
  const sterilityStatus = getBooleanStatus(result.sterility);

  // ارزیابی تست‌های کمی و مقداری
  const assayStatus = getRangeStatus(
    result.assay,
    specification?.assayMin ?? specification?.assay_min,
    specification?.assayMax ?? specification?.assay_max
  );

  const pHStatus = getRangeStatus(
    result.pH ?? result.ph,
    specification?.pHMin ?? specification?.ph_min,
    specification?.pHMax ?? specification?.ph_max
  );

  const particulatedMater25Status = getLessThanStatus(
    result.particulatedMater25 ?? result.particulated_matter_25,
    specification?.particulatedMater25 ?? specification?.particulated_matter_25
  );

  const particulatedMater10Status = getLessThanStatus(
    result.particulatedMater10 ?? result.particulated_matter_10,
    specification?.particulatedMater10 ?? specification?.particulated_matter_10
  );

  const resultEndotoxin = result.endotoxin ?? result.endotonin;
  const specEndotoxin =
    specification?.endotoxin ??
    specification?.endotonin ??
    specification?.endotoxin_max;

  const endotoxinStatus = getLessThanStatus(resultEndotoxin, specEndotoxin);

  const osmolarityStatus = getRangeStatus(
    result.osmolarity ?? result.osmolality,
    specification?.osmolarityMin ?? specification?.osmolality_min,
    specification?.osmolarityMax ?? specification?.osmolality_max
  );

  const uniformityOfDosageStatus = getUniformityStatus(
    result.uniformityOfDosage ?? result.uniformity_of_dosage
  );

  // عنوان وضعیت نگهداری
  const conditionLabel =
    result.accelrator === "Accerator" ||
    result.accelerator === "Accelerator" ||
    result.condition === "Accelerated"
      ? "Accelerated"
      : "Long-Term";

  const timepointLabel =
    result.month ?? result.timepoint ?? result.time_point ?? "0";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* هدر مودال */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Result Details & Specification Check</h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Condition: <span className="font-semibold text-slate-700">{conditionLabel}</span> | Time Point:{" "}
              <span className="font-semibold text-slate-700">{timepointLabel} Month(s)</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        {/* محتوای جدول */}
        <div className="p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">Test Parameter</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">Observed Result</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">Specification Limit</th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-700">Status</th>
                </tr>
              </thead>

              <tbody>
                <Row
                  label="Appearance"
                  value={result.appearance}
                  specValue={specification?.descriptionAppearance ?? specification?.appearance}
                  status={appearanceStatus}
                />

                <Row
                  label="Identification 1"
                  value={result.identification1}
                  specValue={specification?.identification1}
                  status={identification1Status}
                />

                <Row
                  label="Identification 2"
                  value={result.identification2}
                  specValue={specification?.identification2}
                  status={identification2Status}
                />

                <Row
                  label="Assay (%)"
                  value={result.assay}
                  specValue={formatRange(
                    specification?.assayMin ?? specification?.assay_min,
                    specification?.assayMax ?? specification?.assay_max
                  )}
                  status={assayStatus}
                />

                <Row
                  label="pH"
                  value={result.pH ?? result.ph}
                  specValue={formatRange(
                    specification?.pHMin ?? specification?.ph_min,
                    specification?.pHMax ?? specification?.ph_max
                  )}
                  status={pHStatus}
                />

                <Row
                  label="Clarity"
                  value={result.clarity}
                  specValue={specification?.clarity}
                  status={clarityStatus}
                />

                <Row
                  label="Particulate Matter (≥ 25 µm)"
                  value={result.particulatedMater25 ?? result.particulated_matter_25}
                  specValue={formatMax(
                    specification?.particulatedMater25 ?? specification?.particulated_matter_25
                  )}
                  status={particulatedMater25Status}
                />

                <Row
                  label="Particulate Matter (≥ 10 µm)"
                  value={result.particulatedMater10 ?? result.particulated_matter_10}
                  specValue={formatMax(
                    specification?.particulatedMater10 ?? specification?.particulated_matter_10
                  )}
                  status={particulatedMater10Status}
                />

                <Row
                  label="Leak Test"
                  value={result.leakTest ?? result.leak_test}
                  specValue={specification?.leakTest ?? specification?.leak_test}
                  status={leakTestStatus}
                />

                <Row
                  label="Sterility"
                  value={result.sterility}
                  specValue={specification?.sterility}
                  status={sterilityStatus}
                />

                <Row
                  label="Bacterial Endotoxin"
                  value={resultEndotoxin}
                  specValue={formatMax(specEndotoxin)}
                  status={endotoxinStatus}
                />

                <Row
                  label="Osmolality / Osmolarity"
                  value={result.osmolarity ?? result.osmolality}
                  specValue={formatRange(
                    specification?.osmolarityMin ?? specification?.osmolality_min,
                    specification?.osmolarityMax ?? specification?.osmolality_max
                  )}
                  status={osmolarityStatus}
                />

                <Row
                  label="Uniformity of Dosage Units (AV)"
                  value={result.uniformityOfDosage ?? result.uniformity_of_dosage}
                  specValue="< 15"
                  status={uniformityOfDosageStatus}
                />

                {/* مدیریت ناخالصی‌ها / Impurities پویا با ساختار جدید */}
                {Array.isArray(result.contractResultImpurities) &&
                  result.contractResultImpurities.map((item, idx) => {
                    const impSpec = item.specImpurity;
                    const limit = impSpec?.maxLimit ?? impSpec?.limit ?? 0;
                    const value = item.value;
                    const impStatus = getLessThanStatus(value, limit);

                    return (
                      <Row
                        key={item.id || idx}
                        label={`Impurity: ${impSpec?.name || `Impurity ${idx + 1}`}`}
                        value={value}
                        specValue={formatMax(limit)}
                        status={impStatus}
                      />
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* فوتر مودال */}
        <div className="flex items-center justify-end border-t border-slate-200 bg-slate-50 px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-800 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
