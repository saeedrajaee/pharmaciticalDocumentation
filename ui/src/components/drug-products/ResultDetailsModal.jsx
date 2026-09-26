"use client";

function toNumber(value) {
  if (value === null || value === undefined || value === "") return null;

  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function normalizeBooleanLike(value) {
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function getBooleanStatus(value) {
  const normalized = normalizeBooleanLike(value);

  if (normalized === null) {
    return { label: "N/A", passed: null };
  }

  return normalized
    ? { label: "Pass", passed: true }
    : { label: "Fail", passed: false };
}

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

function getLessThanStatus(value, max) {
  const current = toNumber(value);
  const maxValue = toNumber(max);

  if (current === null || maxValue === null) {
    return { label: "N/A", passed: null };
  }

  const passed = current < maxValue;
  return { label: passed ? "Pass" : "Fail", passed };
}

function getUniformityStatus(value) {
  const current = toNumber(value);

  if (current === null) {
    return { label: "N/A", passed: null };
  }

  const passed = current < 15;
  return { label: passed ? "Pass" : "Fail", passed };
}

function statusBadgeClass(passed) {
  if (passed === true) {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (passed === false) {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border border-slate-200 bg-slate-50 text-slate-500";
}

function rowClass(passed) {
  if (passed === true) {
    return "border-t border-emerald-100 bg-emerald-50/60";
  }

  if (passed === false) {
    return "border-t border-rose-100 bg-rose-50/60";
  }

  return "border-t border-slate-200 bg-white";
}

// تابع اصلاح شده برای نمایش Pass/Fail به جای true/false
function formatValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  
  // بررسی مقادیر بولین یا رشته‌های معادل بولین
  if (value === true || value === "true") return "Pass";
  if (value === false || value === "false") return "Fail";
  
  return String(value);
}

function formatRange(min, max) {
  const minValue = formatValue(min);
  const maxValue = formatValue(max);

  if (minValue === "-" && maxValue === "-") return "-";
  return `${minValue} - ${maxValue}`;
}

function formatMax(max) {
  const maxValue = formatValue(max);
  if (maxValue === "-") return "-";
  return `< ${maxValue}`;
}

function Row({ label, value, specValue, status }) {
  return (
    <tr className={rowClass(status.passed)}>
      <td className="px-4 py-3 text-sm font-semibold text-slate-700">{label}</td>
      <td className="px-4 py-3 text-sm text-slate-800">{formatValue(value)}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{specValue}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${statusBadgeClass(
            status.passed
          )}`}
        >
          {status.label}
        </span>
      </td>
    </tr>
  );
}

export default function ResultDetailsModal({
  result,
  specification,
  onClose,
}) {
  if (!result) return null;

  const appearanceStatus = getBooleanStatus(result.appearance);
  const identification1Status = getBooleanStatus(result.identification1);
  const identification2Status = getBooleanStatus(result.identification2);
  const assayStatus = getRangeStatus(
    result.assay,
    specification?.assayMin,
    specification?.assayMax
  );
  const pHStatus = getRangeStatus(
    result.pH,
    specification?.pHMin,
    specification?.pHMax
  );
  const clarityStatus = getBooleanStatus(result.clarity);
  const particulatedMater25Status = getLessThanStatus(
    result.particulatedMater25,
    specification?.particulatedMater25
  );
  const particulatedMater10Status = getLessThanStatus(
    result.particulatedMater10,
    specification?.particulatedMater10
  );
  const leakTestStatus = getBooleanStatus(result.leakTest);
  const sterilityStatus = getBooleanStatus(result.sterility);

  const resultEndotoxin = result.endotoxin ?? result.endotonin;
  const specificationEndotoxin =
    specification?.endotoxin ?? specification?.endotonin;

  const endotoxinStatus = getLessThanStatus(
    resultEndotoxin,
    specificationEndotoxin
  );

  const osmolarityStatus = getRangeStatus(
    result.osmolarity,
    specification?.osmolarityMin,
    specification?.osmolarityMax
  );
  const uniformityOfDosageStatus = getUniformityStatus(
    result.uniformityOfDosage
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-300 bg-white shadow-2xl shadow-slate-300/40">
        <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-black text-slate-900">Result Details</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <div className="p-6">
          <div className="overflow-hidden rounded-2xl border border-slate-300">
            <table className="w-full border-collapse">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-black text-slate-800">Test</th>
                  <th className="px-4 py-3 text-left text-sm font-black text-slate-800">Result</th>
                  <th className="px-4 py-3 text-left text-sm font-black text-slate-800">Specification</th>
                  <th className="px-4 py-3 text-left text-sm font-black text-slate-800">Status</th>
                </tr>
              </thead>

              <tbody>
                <Row
                  label="Appearance"
                  value={result.appearance}
                  specValue={specification?.descriptionAppearance}
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
                  label="Assay"
                  value={result.assay}
                  specValue={formatRange(
                    specification?.assayMin,
                    specification?.assayMax
                  )}
                  status={assayStatus}
                />

                <Row
                  label="pH"
                  value={result.pH}
                  specValue={formatRange(
                    specification?.pHMin,
                    specification?.pHMax
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
                  label="Particulated Mater 25"
                  value={result.particulatedMater25}
                  specValue={formatMax(specification?.particulatedMater25)}
                  status={particulatedMater25Status}
                />

                <Row
                  label="Particulated Mater 10"
                  value={result.particulatedMater10}
                  specValue={formatMax(specification?.particulatedMater10)}
                  status={particulatedMater10Status}
                />

                <Row
                  label="Leak Test"
                  value={result.leakTest}
                  specValue={specification?.leakTest}
                  status={leakTestStatus}
                />

                <Row
                  label="Sterility"
                  value={result.sterility}
                  specValue={specification?.sterility}
                  status={sterilityStatus}
                />

                <Row
                  label="Endotoxin"
                  value={resultEndotoxin}
                  specValue={formatMax(specificationEndotoxin)}
                  status={endotoxinStatus}
                />

                <Row
                  label="osmolarity"
                  value={result.osmolarity}
                  specValue={formatRange(
                    specification?.osmolarityMin,
                    specification?.osmolarityMax
                  )}
                  status={osmolarityStatus}
                />

                <Row
                  label="Uniformity Of Dosage"
                  value={result.uniformityOfDosage}
                  specValue="< 15"
                  status={uniformityOfDosageStatus}
                />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
