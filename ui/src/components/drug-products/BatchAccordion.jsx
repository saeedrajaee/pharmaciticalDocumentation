"use client";

function InfoItem({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3">
      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-800">{value || "-"}</p>
    </div>
  );
}

export default function BatchAccordion({
  batch,
  index,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onAddSpec,
  onEditSpec,
  onDeleteSpec,
  onViewSpecDetails,
}) {

  const formattedDate = batch.batchDate
  ? new Date(batch.batchDate).toLocaleDateString('fa-IR', { // 'fa-IR' برای فرمت فارسی
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    })
  : "-";

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-600 bg-slate-200">
      <div
        className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-4 transition hover:bg-slate-200"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-700">
            Batch {index + 1}
          </span>

          <span className="text-sm font-semibold text-slate-700">
            {batch.batchNumber || "No batch date"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700 transition hover:bg-amber-100"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
          >
            Delete
          </button>

          <span className="text-sm text-slate-400">{isOpen ? "▲" : "▼"}</span>
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-slate-200 bg-slate-50/50 p-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* <InfoItem label="Batch Date" value={batch.batchDate || "-"} /> */}
            <InfoItem label="Batch Date" value={formattedDate} />
            <InfoItem label="Batch Number" value={batch.batchNumber || "-"} />
            <InfoItem label="Description" value={batch.description || "-"} />
            <InfoItem
              label="Result Count"
              value={String(batch.results?.length || 0)}
            />
            <InfoItem label="Document" value={batch.uploadDoc || "-"} />
          </div>

          <div className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-black text-slate-800">Result</h4>

              <button
                type="button"
                onClick={onAddSpec}
                className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800 transition hover:bg-emerald-200"
              >
                Add Result
              </button>
            </div>

            {batch.results?.length ? (
              <div className="space-y-2">
                {batch.results.map((spec, specIndex) => (
                  <div
                    key={spec.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-800">
                        {spec.name || `Result ${specIndex + 1}`}
                      </p>
                      <p className="text-xs text-slate-500">
                        {spec.value || "-"} {spec.unit || ""}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => onViewSpecDetails(spec)}
                        className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                      > 
                        Details
                      </button>

                      <button
                        type="button"
                        onClick={() => onEditSpec(spec)}
                        className="rounded-xl border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 transition hover:bg-sky-100"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteSpec(spec.id)}
                        className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center text-sm text-slate-500">
                No Result registered for this batch
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
