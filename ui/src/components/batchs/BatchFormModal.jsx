"use client";

function formatDateForInput(dateValue) {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function BatchFormModal({
  title,
  submitText,
  defaultValues = {},
  onClose,
  onSubmit,
  productId,
  userId,
}) {
  const maxDate = getTodayDate();

  const resolvedProductId = productId || defaultValues.drugProductId || "";
  const resolvedUserId = userId || defaultValues.userId || "";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
          <h2 className="text-lg font-black text-slate-800">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <form action={onSubmit} className="grid gap-4 p-6">
          <input type="hidden" name="drugProductId" value={resolvedProductId} />
          <input type="hidden" name="userId" value={resolvedUserId} />

          <div className="flex flex-col gap-1.5">
            <label className="px-1 text-xs font-semibold text-slate-500">
              Batch Date
            </label>
            <input
              name="batchDate"
              type="date"
              defaultValue={formatDateForInput(defaultValues.batchDate)}
              max={maxDate}
              onClick={(e) => {
                try {
                  e.currentTarget.showPicker?.();
                } catch {}
              }}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="px-1 text-xs font-semibold text-slate-500">
              Batch Number
            </label>
            <textarea
              name="batchNumber"
              rows={1}
              defaultValue={defaultValues.batchNumber || ""}
              placeholder="Enter batch Number..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-500"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="px-1 text-xs font-semibold text-slate-500">
              Description
            </label>
            <textarea
              name="description"
              rows={4}
              defaultValue={defaultValues.description || ""}
              placeholder="Enter batch details..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-sky-500"
            />
          </div>

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-300/30 transition hover:from-sky-400 hover:to-indigo-400 hover:shadow-lg"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
