"use client";

import { useEffect, useState } from "react";

const ALLOWED_MONTHS = [0, 3, 6, 9, 12, 18, 24, 30, 36];

function toStringValue(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function toBooleanValue(value) {
  if (value === true || value === false) return value;
  return "";
}

function createEmptyImpurity() {
  return {
    name: "",
    value: "",
    description: "",
  };
}

function normalizeMonth(value) {
  const stringValue = toStringValue(value);
  return ALLOWED_MONTHS.includes(Number(stringValue)) ? stringValue : "";
}

function createInitialForm(defaultValues = {}, batchId, userId) {
  return {
    accelrator: defaultValues.accelrator || "Long",
    month: normalizeMonth(defaultValues.month),
    appearance: toBooleanValue(defaultValues.appearance),
    descriptionAppearance: defaultValues.descriptionAppearance || "",
    identification1: defaultValues.identification1 || "",
    identification2: defaultValues.identification2 || "",
    assay: toStringValue(defaultValues.assay),
    pH: toStringValue(defaultValues.pH),
    clarity: toBooleanValue(defaultValues.clarity),
    descriptionClarity: defaultValues.descriptionClarity || "",
    particulatedMater25: toStringValue(defaultValues.particulatedMater25),
    particulatedMater10: toStringValue(defaultValues.particulatedMater10),
    leakTest: toBooleanValue(defaultValues.leakTest),
    sterility: toBooleanValue(defaultValues.sterility),
    endotoxin: toStringValue(defaultValues.endotoxin),
    osmolarity: toStringValue(defaultValues.osmolarity),
    preservativeContent: toStringValue(defaultValues.preservativeContent),
    uniformityOfDosage: toStringValue(defaultValues.uniformityOfDosage),
    impurities:
      defaultValues.impurities?.length > 0
        ? defaultValues.impurities.map((item) => ({
            name: item?.name || "",
            value: toStringValue(item?.value),
            description: item?.description || "",
          }))
        : [createEmptyImpurity()],
    userId: toStringValue(defaultValues.userId || userId || ""),
    batchId: toStringValue(defaultValues.batchId || batchId || ""),
  };
}

export default function ResultFormModal({
  title,
  submitText,
  defaultValues = {},
  onClose,
  onSubmit,
  batchId,
  userId,
}) {
  const [form, setForm] = useState(() =>
    createInitialForm(defaultValues, batchId, userId),
  );

  useEffect(() => {
    setForm(createInitialForm(defaultValues, batchId, userId));
  }, [defaultValues, batchId, userId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleBooleanChange(name, value) {
    setForm((prev) => ({
      ...prev,
      [name]: value === "" ? "" : value === "true",
    }));
  }

  function handleImpurityChange(index, field, value) {
    setForm((prev) => ({
      ...prev,
      impurities: prev.impurities.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function addImpurity() {
    setForm((prev) => ({
      ...prev,
      impurities: [...prev.impurities, createEmptyImpurity()],
    }));
  }

  function removeImpurity(index) {
    setForm((prev) => ({
      ...prev,
      impurities:
        prev.impurities.length === 1
          ? [createEmptyImpurity()]
          : prev.impurities.filter((_, i) => i !== index),
    }));
  }

  function parseOptionalNumber(value) {
    return value === "" ? undefined : Number(value);
  }

  function parseOptionalInteger(value) {
    return value === "" ? undefined : parseInt(value, 10);
  }

  function parseOptionalBoolean(value) {
    return value === "" ? undefined : value;
  }

  function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      accelrator: form.accelrator || undefined,
      month: parseOptionalInteger(form.month),
      appearance: parseOptionalBoolean(form.appearance),
      identification1: parseOptionalBoolean(form.identification1),
      identification2: parseOptionalBoolean(form.identification2),
      assay: parseOptionalNumber(form.assay),
      pH: parseOptionalNumber(form.pH),
      clarity: parseOptionalBoolean(form.clarity),
      particulatedMater25: parseOptionalNumber(form.particulatedMater25),
      particulatedMater10: parseOptionalNumber(form.particulatedMater10),
      leakTest: parseOptionalBoolean(form.leakTest),
      sterility: parseOptionalBoolean(form.sterility),
      endotoxin: parseOptionalNumber(form.endotoxin),
      osmolarity: parseOptionalNumber(form.osmolarity),
      uniformityOfDosage: parseOptionalNumber(form.uniformityOfDosage),
      impurities: form.impurities
        .map((item) => ({
          name: item.name.trim(),
          value: item.value.trim(),
          description: item.description.trim(),
        }))
        .filter(
          (item) =>
            item.name !== "" || item.value !== "" || item.description !== "",
        )
        .map((item) => ({
          name: item.name,
          value: Number(item.value),
          description: item.description,
        })),
      userId: form.userId ? parseInt(form.userId, 10) : undefined,
      batchId: parseInt(batchId || form.batchId, 10),
    };

    onSubmit(payload);
  }

  const fieldClassName =
    "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:ring-2 focus:ring-sky-200";

  const tableHeaderClass =
    "bg-slate-100 px-4 py-3 text-left text-sm font-black text-slate-800";
  const tableCellClass = "border-t border-slate-200 px-4 py-3 align-middle";
  const labelCellClass =
    "border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 align-middle";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/25 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-300 bg-white shadow-2xl shadow-slate-300/40">
        <div className="flex items-center justify-between border-b border-slate-300 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-black text-slate-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <select
              name="accelrator"
              value={form.accelrator}
              onChange={handleChange}
              className={fieldClassName}
            >
              <option value="Long">Long</option>
              <option value="Accelerate">Accelerate</option>
            </select>

            <select
              name="month"
              value={form.month}
              onChange={handleChange}
              className={fieldClassName}
            >
              <option value="">Select Month</option>
              {ALLOWED_MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

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
                      value={
                        form.appearance === "" ? "" : String(form.appearance)
                      }
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
                  <td className={labelCellClass}>Identification 1</td>
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
                  <td className={labelCellClass}>NMT endotoxin</td>
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
                  <td className={labelCellClass}>NMT Particulat Mater 25 um</td>
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
                  <td className={labelCellClass}>NMT Particulat Mater 10 um</td>
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
                  <td className={labelCellClass}>Uniformity Of Dosage</td>
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
                  <td className={labelCellClass}>Assay</td>
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
                  <td className={labelCellClass}>osmolarity</td>
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

          <div className="rounded-2xl border border-slate-300 bg-slate-50 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900">Impurities</h3>

              <button
                type="button"
                onClick={addImpurity}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                Add Impurity
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={tableHeaderClass}>Name</th>
                    <th className={tableHeaderClass}>Result</th>
                    <th className={tableHeaderClass}>Description</th>
                    <th className={tableHeaderClass}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.impurities.map((item, index) => (
                    <tr key={index}>
                      <td className={tableCellClass}>
                        <input
                          value={item.name}
                          onChange={(e) =>
                            handleImpurityChange(index, "name", e.target.value)
                          }
                          placeholder="Impurity A"
                          className={fieldClassName}
                        />
                      </td>

                      <td className={tableCellClass}>
                        <input
                          type="number"
                          step="any"
                          value={item.value}
                          onChange={(e) =>
                            handleImpurityChange(index, "value", e.target.value)
                          }
                          placeholder="0.1"
                          className={fieldClassName}
                        />
                      </td>

                      <td className={tableCellClass}>
                        <input
                          value={item.description}
                          onChange={(e) =>
                            handleImpurityChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="RRT"
                          className={fieldClassName}
                        />
                      </td>

                      <td className={tableCellClass}>
                        <button
                          type="button"
                          onClick={() => removeImpurity(index)}
                          className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <input type="hidden" name="userId" value={form.userId} readOnly />
          <input
            type="hidden"
            name="batchId"
            value={batchId || form.batchId}
            readOnly
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white transition hover:from-sky-400 hover:to-indigo-400"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
