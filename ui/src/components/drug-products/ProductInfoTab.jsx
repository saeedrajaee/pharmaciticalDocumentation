"use client";

import BatchAccordion from "@/components/drug-products/BatchAccordion";

function InfoItem({ label, value }) {
  const displayValue =
    value !== undefined && value !== null && value !== "" ? value : "-";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-slate-800">
        {displayValue}
      </p>
    </div>
  );
}

export default function ProductInfoTab({
  productDetails,
  openBatchId,
  setOpenBatchId,
  onAddBatch,
  onEditBatch,
  onDeleteBatch,
  onAddResult,
  onEditResult,
  onDeleteResult,
  onViewResultDetails,
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-100 p-4 md:grid-cols-2">
        <InfoItem
          label="Product Name"
          value={productDetails.finishedProductName}
        />
        <InfoItem label="API" value={productDetails.api} />
        <InfoItem label="Dosage Form" value={productDetails.dosageForm} />
        <InfoItem
          label="Strength"
          value={`${productDetails.strength || "-"} ${
            productDetails.strengthUnit || ""
          }`}
        />
        <InfoItem
          label="Storage Condition"
          value={productDetails.strongCondition}
        />
        <InfoItem label="Owner" value={productDetails.user?.name || "-"} />
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-black text-slate-800">Batch Results</h3>

          <button
            type="button"
            onClick={onAddBatch}
            className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2 text-sm font-bold text-white transition hover:from-sky-400 hover:to-indigo-400"
          >
            Add Batch
          </button>
        </div>

        {productDetails.batches?.length ? (
          <div className="space-y-4">
            {productDetails.batches.map((batch, index) => (
              <BatchAccordion
                key={batch.id}
                batch={batch}
                index={index}
                isOpen={openBatchId === batch.id}
                onToggle={() =>
                  setOpenBatchId((prev) =>
                    prev === batch.id ? null : batch.id,
                  )
                }
                onEdit={() => onEditBatch(batch)}
                onDelete={() => onDeleteBatch(batch.id)}
                onAddSpec={() => onAddResult(batch.id)}
                onEditSpec={(result) => onEditResult(batch.id, result)}
                onDeleteSpec={(resultId) =>
                  onDeleteResult(batch.id, resultId)
                }
                onViewSpecDetails={(result) => onViewResultDetails(result)}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No batch results have been registered for this product yet
          </div>
        )}
      </div>
    </div>
  );
}
