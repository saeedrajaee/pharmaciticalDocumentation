"use client";

function formatImpurities(impurities) {
  if (!Array.isArray(impurities) || !impurities.length) return "-";

  return impurities
    .map((item) => {
      const name = item?.name || "-";
      const value = item?.value ?? "-";
      const description = item?.description ? ` (${item.description})` : "";
      return `${name}: ${value}${description}`;
    })
    .join(" , ");
}

export default function ProductSpecificationTab({
  specifications,
  openSpecificationId,
  setOpenSpecificationId,
  pending,
  onAddSpecification,
  onEditSpecification,
  onDeleteSpecification,
}) {
  const specsList = specifications
    ? Array.isArray(specifications)
      ? specifications
      : [specifications]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-slate-800">
            Stability Specifications
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Review and manage the stability specifications for this product
          </p>
        </div>

        <button
          type="button"
          onClick={onAddSpecification}
          className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:from-sky-400 hover:to-indigo-400"
        >
          Add Specification
        </button>
      </div>

      <div className="space-y-4">
        {!specsList.length ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No specifications found for this product
          </div>
        ) : (
          specsList.map((spec, index) => {
            const isExpanded = openSpecificationId === spec.id;

            return (
              <div
                key={spec.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                  <span className="text-sm font-bold text-slate-700">
                    Specification #{index + 1}
                  </span>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSpecificationId((prev) =>
                          prev === spec.id ? null : spec.id,
                        )
                      }
                      className="rounded-xl border border-sky-300 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                    >
                      {isExpanded ? "Hide Details" : "Details"}
                    </button>

                    <button
                      type="button"
                      onClick={() => onEditSpecification(spec)}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDeleteSpecification(spec.id)}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded ? (
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
                              {spec.uniformityOfDosage || "-"}
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
                            <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
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
                            <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
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
                            <td className="border-t border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
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
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
