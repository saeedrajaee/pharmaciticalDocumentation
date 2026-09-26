"use client";

import { useEffect, useState } from "react";

function toStringValue(value) {
  return value === null || value === undefined ? "" : String(value);
}

function createInitialForm(defaultValues = {}, productId, userId) {
  return {
    descriptionAppearance: defaultValues.descriptionAppearance ?? "",
    identification1: defaultValues.identification1 ?? "",
    identification2: defaultValues.identification2 ?? "",
    assayMin: toStringValue(defaultValues.assayMin),
    assayMax: toStringValue(defaultValues.assayMax),
    pHMin: toStringValue(defaultValues.pHMin),
    pHMax: toStringValue(defaultValues.pHMax),
    clarity: defaultValues.clarity ?? "",
    particulatedMater25: toStringValue(defaultValues.particulatedMater25),
    particulatedMater10: toStringValue(defaultValues.particulatedMater10),
    sterility: defaultValues.sterility ?? "",
    leakTest: defaultValues.leakTest ?? "",
    endotoxin: toStringValue(defaultValues.endotoxin),
    osmolarityMin: toStringValue(defaultValues.osmolarityMin),
    osmolarityMax: toStringValue(defaultValues.osmolarityMax),
    preservativeContent: toStringValue(defaultValues.preservativeContent),
    uniformityOfDosage: defaultValues.uniformityOfDosage ?? "",
    impurities:
      defaultValues.impurities?.length > 0
        ? defaultValues.impurities.map((item) => ({
            name: item?.name ?? "",
            value: toStringValue(item?.value),
            description: item?.description ?? "",
          }))
        : [{ name: "", value: "", description: "" }],
    userId: toStringValue(defaultValues.userId ?? userId ?? ""),
    drugProductId: toStringValue(defaultValues.drugProductId ?? productId ?? ""),
  };
}


export default function SpecificationFormModal({
  title,
  submitText,
  defaultValues = {},
  onClose,
  onSubmit,
  productId,
  userId,
}) {
  const [form, setForm] = useState(() =>
    createInitialForm(defaultValues, productId, userId),
  );

  useEffect(() => {
    setForm(createInitialForm(defaultValues, productId, userId));
  }, [defaultValues, productId, userId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
    impurities: [
      ...prev.impurities,
      { id: crypto.randomUUID(), name: "", value: "", description: "" },
    ],
  }));
}


  function removeImpurity(index) {
    setForm((prev) => ({
      ...prev,
      impurities:
        prev.impurities.length === 1
          ? [{ name: "", value: "", description: "" }]
          : prev.impurities.filter((_, i) => i !== index),
    }));
  }

  function parseNumber(value) {
    return value === "" ? undefined : Number(value);
  }

  function handleSubmit(e) {
    e.preventDefault();

    const payload = {
      descriptionAppearance: form.descriptionAppearance || undefined,
      identification1: form.identification1 || undefined,
      identification2: form.identification2 || undefined,
      assayMin: parseNumber(form.assayMin),
      assayMax: parseNumber(form.assayMax),
      pHMin: parseNumber(form.pHMin),
      pHMax: parseNumber(form.pHMax),
      clarity: form.clarity || undefined,
      particulatedMater25: parseNumber(form.particulatedMater25),
      particulatedMater10: parseNumber(form.particulatedMater10),
      sterility: form.sterility || undefined,
      leakTest: form.leakTest || undefined,
      endotoxin: parseNumber(form.endotoxin),
      osmolarityMin: parseNumber(form.osmolarityMin),
      osmolarityMax: parseNumber(form.osmolarityMax),
      preservativeContent: parseNumber(form.preservativeContent),
      uniformityOfDosage: form.uniformityOfDosage || undefined,
      impurities: form.impurities
        .filter((item) => item.name || item.value || item.description)
        .map((item) => ({
          name: item.name || "",
          value: item.value === "" ? undefined : Number(item.value),
          description: item.description || "",
        })),
      drugProductId: productId ? Number(productId) : Number(form.drugProductId),
      userId: form.userId ? Number(form.userId) : undefined,
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

    console.log("defaultValues", defaultValues);
console.log("form", form);

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
          <div className="overflow-hidden rounded-2xl border border-slate-300">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={tableHeaderClass}>Test</th>
                  <th className={tableHeaderClass}>Acceptance Limit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={labelCellClass}>Appearance Description</td>
                  <td className={tableCellClass}>
                    <input
                      name="descriptionAppearance"
                      value={form.descriptionAppearance}
                      onChange={handleChange}
                      placeholder="Clear, colorless solution"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Identification 1</td>
                  <td className={tableCellClass}>
                    <input
                      name="identification1"
                      value={form.identification1}
                      onChange={handleChange}
                      placeholder="Matches reference standard"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Identification 2</td>
                  <td className={tableCellClass}>
                    <input
                      name="identification2"
                      value={form.identification2}
                      onChange={handleChange}
                      placeholder="Retention time conforms"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Clarity</td>
                  <td className={tableCellClass}>
                    <input
                      name="clarity"
                      value={form.clarity}
                      onChange={handleChange}
                      placeholder="Clear"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Sterility</td>
                  <td className={tableCellClass}>
                    <input
                      name="sterility"
                      value={form.sterility}
                      onChange={handleChange}
                      placeholder="Sterile"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Leak Test</td>
                  <td className={tableCellClass}>
                    <input
                      name="leakTest"
                      value={form.leakTest}
                      onChange={handleChange}
                      placeholder="Pass"
                      className={fieldClassName}
                    />
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
                  <td className={labelCellClass}>NMT Particulat Matter 25 um</td>
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
                  <td className={labelCellClass}>NMT Particulat Matter 10 um</td>
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
                  <td className={labelCellClass}>NMT Preservative Content</td>
                  <td className={tableCellClass}>
                    <input
                      name="preservativeContent"
                      type="number"
                      step="any"
                      value={form.preservativeContent}
                      onChange={handleChange}
                      placeholder="0.90"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>Uniformity Of Dosage</td>
                  <td className={tableCellClass}>
                    <input
                      name="uniformityOfDosage"
                      value={form.uniformityOfDosage}
                      onChange={handleChange}
                      placeholder="Complies"
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
                  <th className={tableHeaderClass}>Acceptance Limit Min</th>
                  <th className={tableHeaderClass}>Acceptance Limit Max</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={labelCellClass}>Assay</td>
                  <td className={tableCellClass}>
                    <input
                      name="assayMin"
                      type="number"
                      step="any"
                      value={form.assayMin}
                      onChange={handleChange}
                      placeholder="98"
                      className={fieldClassName}
                    />
                  </td>
                  <td className={tableCellClass}>
                    <input
                      name="assayMax"
                      type="number"
                      step="any"
                      value={form.assayMax}
                      onChange={handleChange}
                      placeholder="102"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>pH</td>
                  <td className={tableCellClass}>
                    <input
                      name="pHMin"
                      type="number"
                      step="any"
                      value={form.pHMin}
                      onChange={handleChange}
                      placeholder="3.5"
                      className={fieldClassName}
                    />
                  </td>
                  <td className={tableCellClass}>
                    <input
                      name="pHMax"
                      type="number"
                      step="any"
                      value={form.pHMax}
                      onChange={handleChange}
                      placeholder="5.5"
                      className={fieldClassName}
                    />
                  </td>
                </tr>

                <tr>
                  <td className={labelCellClass}>osmolarity</td>
                  <td className={tableCellClass}>
                    <input
                      name="osmolarityMin"
                      type="number"
                      step="any"
                      value={form.osmolarityMin}
                      onChange={handleChange}
                      placeholder="260"
                      className={fieldClassName}
                    />
                  </td>
                  <td className={tableCellClass}>
                    <input
                      name="osmolarityMax"
                      type="number"
                      step="any"
                      value={form.osmolarityMax}
                      onChange={handleChange}
                      placeholder="320"
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
                    <th className={tableHeaderClass}>Acceptance Limit</th>
                    <th className={tableHeaderClass}>Description</th>
                    <th className={tableHeaderClass}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {form.impurities.map((item, index) => (
                    <tr key={item.id ?? index}>
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
                          placeholder="NMT 0.1 %"
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
