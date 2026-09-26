"use client";

import Link from "next/link";
import { useMemo, useState, useTransition, useEffect } from "react";
import {
  createBatchAction,
  deleteBatchAction,
  updateBatchAction,
} from "@/app/actions/batch-actions";
import BatchFormModal from "./BatchFormModal";

const emptyForm = {
  batchNumber: "",
  batchDate: "",
  description: "",
  drugProductId: "",
};

// ماه‌های مورد نیاز برای تست پایداری
const STABILITY_MONTHS = [3, 6, 9, 12, 18, 24, 30, 36];

// تابع کمکی برای بررسی وضعیت تست پایداری جهت نمایش هشدار
function checkStability(batchDate) {
  if (!batchDate) return null;
  const start = new Date(batchDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (const months of STABILITY_MONTHS) {
    const targetDate = new Date(start);
    targetDate.setMonth(targetDate.getMonth() + months);

    const diffTime = targetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // اگر بین ۰ تا ۱۰ روز به تاریخ تست مانده باشد
    if (diffDays >= 0 && diffDays <= 10) {
      return {
        isApproaching: true,
        targetDate: targetDate.toLocaleDateString("fa-IR"),
        months,
        daysLeft: diffDays,
      };
    }
  }
  return null;
}

// تابع کمکی برای محاسبه اولین تاریخِ تستِ پایداریِ آینده (برای مرتب‌سازی)
function getNextStabilityDate(batchDate) {
  if (!batchDate) return null;
  const start = new Date(batchDate);
  const now = new Date();
  
  for (const months of STABILITY_MONTHS) {
    const targetDate = new Date(start);
    targetDate.setMonth(targetDate.getMonth() + months);
    if (targetDate > now) return targetDate; // اولین تاریخی که هنوز نرسیده
  }
  return null; // یعنی تمام تست‌ها در گذشته انجام شده‌اند
}

export default function BatchClient({ initialBatch }) {
  const [batches, setBatches] = useState(initialBatch || []);
  const [search, setSearch] = useState("");
  const [productFilter, setProductFilter] = useState("All");
  const [detailsItem, setDetailsItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [stabilityAlerts, setStabilityAlerts] = useState([]);

  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!batches.length) return;

    const alerts = [];
    batches.forEach((batch) => {
      const stabilityStatus = checkStability(batch.batchDate);
      if (stabilityStatus?.isApproaching) {
        alerts.push({
          batchNumber: batch.batchNumber,
          targetDate: stabilityStatus.targetDate,
          months: stabilityStatus.months,
          daysLeft: stabilityStatus.daysLeft,
        });
      }
    });

    if (alerts.length > 0) {
      alerts.sort((a, b) => a.daysLeft - b.daysLeft);
      setStabilityAlerts(alerts);
    }
  }, [batches]);

  const productOptions = useMemo(() => {
    const ids = batches.map((b) => b.drugProductId).filter(Boolean);
    return ["All", ...Array.from(new Set(ids))];
  }, [batches]);

  const filteredBatches = useMemo(() => {
    // ۱. فیلتر کردن
    let result = batches.filter((item) => {
      const query = search.toLowerCase();
      const matchesSearch =
        item.batchNumber?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query);

      const matchesFilter =
        productFilter === "All" || item.drugProductId === productFilter;

      return matchesSearch && matchesFilter;
    });

    // ۲. مرتب‌سازی بر اساس تاریخ تست بعدی
    return result.sort((a, b) => {
      const dateA = getNextStabilityDate(a.batchDate);
      const dateB = getNextStabilityDate(b.batchDate);

      // بچ‌هایی که تاریخ تست آینده دارند اول می‌آیند
      if (dateA && dateB) return dateA.getTime() - dateB.getTime();
      if (dateA && !dateB) return -1;
      if (!dateA && dateB) return 1;
      
      return 0; // اگر هیچکدام تست آینده ندارند ترتیب حفظ شود
    });
  }, [batches, search, productFilter]);

  async function handleCreate(formData) {
    startTransition(async () => {
      const result = await createBatchAction(formData);
      if (!result?.success) {
        alert(result?.message || "Create request failed");
        return;
      }
      if (result?.data) {
        setBatches((prev) => [result.data, ...prev]);
      }
      setShowCreate(false);
    });
  }

  async function handleUpdate(formData) {
    if (!editingItem?.id) return;
    startTransition(async () => {
      const result = await updateBatchAction(editingItem.id, formData);
      if (!result?.success) {
        alert(result?.message || "Update request failed");
        return;
      }
      const updatedItem = result?.data;
      if (updatedItem) {
        setBatches((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedItem : item)),
        );
      }
      setEditingItem(null);
    });
  }

  function handleDelete(id) {
    const confirmed = window.confirm("Are you sure you want to delete this batch?");
    if (!confirmed) return;
    startTransition(async () => {
      const result = await deleteBatchAction(id);
      if (!result?.success) {
        alert(result?.message || "Delete request failed");
        return;
      }
      setBatches((prev) => prev.filter((item) => item.id !== id));
    });
  }

  return (
    <div className="space-y-6 relative">
      {/* پاپ‌آپ پیام‌های تست پایداری */}
      {stabilityAlerts.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm rounded-2xl border border-rose-500/30 bg-rose-950/90 p-5 shadow-2xl backdrop-blur-md">
          <div dir="rtl" className="mb-3 flex items-center justify-between">
            <h3 className="font-bold text-rose-400">هشدار تست پایداری</h3>
            <button
              onClick={() => setStabilityAlerts([])}
              className="text-rose-400 hover:text-rose-200"
            >
              ✕
            </button>
          </div>
          <div dir="rtl" className="text-right max-h-48 space-y-3 overflow-y-auto text-sm text-rose-100">
            {stabilityAlerts.map((alert, idx) => (
              <div key={idx} className="rounded-lg bg-rose-900/50 p-3">
                زمان تست پایداری ({alert.months} ماهه) بچ نامبر
                <br />
                <strong>{alert.batchNumber}</strong>
                <br />
                در تاریخ <strong>{alert.targetDate}</strong> می‌باشد. ({alert.daysLeft} روز مانده)
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white">Batches</h1>
              <p className="mt-1 text-sm text-white/60">Search, filter, create, update, and review batches</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/home" className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white">
                Back to Home
              </Link>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-sky-400 hover:to-indigo-400 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                Add Batch
              </button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Search by batch number or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-400"
            />
            <select
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400"
            >
              {productOptions.map((item) => (
                <option key={item} value={item} className="bg-slate-900 text-white">
                  {item === "All" ? "All Products" : `Product ID: ${item}`}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-600 bg-slate-800/80">
                  <tr className="text-sm text-slate-100">
                    <th className="px-4 py-4 font-semibold">No.</th>
                    <th className="px-4 py-4 font-semibold">Batch Number</th>
                    <th className="px-4 py-4 font-semibold">Batch Date</th>
                    <th className="px-4 py-4 font-semibold">Description</th>
                    <th className="px-4 py-4 font-semibold">Product ID</th>
                    <th className="px-4 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/90">
                  {filteredBatches.length > 0 ? (
                    filteredBatches.map((item, index) => {
                      const stabilityInfo = checkStability(item.batchDate);
                      const rowClasses = stabilityInfo?.isApproaching
                        ? "bg-slate-900/20 text-orange-400" // هایلایت برای هشدار فوری
                        : "bg-slate-900/40 text-slate-300";

                      return (
                        <tr
                          key={item.id}
                          className={`group border-b border-slate-800/50 text-sm transition hover:bg-slate-800/70 ${rowClasses}`}
                        >
                          <td className="px-4 py-4 font-semibold group-hover:text-white">{index + 1}</td>
                          <td className="px-4 py-4 font-semibold group-hover:text-white">{item.batchNumber || "-"}</td>
                          <td className="px-4 py-4 font-semibold group-hover:text-white">
                            {item.batchDate ? new Date(item.batchDate).toLocaleDateString() : "-"}
                          </td>
                          <td className="px-4 py-4 font-semibold group-hover:text-white">{item.description || "-"}</td>
                          <td className="px-4 py-4 font-semibold group-hover:text-white">{item.drugProductId || "-"}</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setEditingItem(item)}
                                className="rounded-xl border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-500/30"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={pending}
                                onClick={() => handleDelete(item.id)}
                                className="rounded-xl border border-rose-300/60 bg-rose-300/20 px-3 py-1.5 text-xs font-bold text-rose-100 transition hover:bg-rose-300/30 disabled:opacity-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-4 py-10 text-center text-sm text-slate-400">
                        No batches found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <BatchFormModal
                  key="create-modal"

          title="Add Batch"
          submitText={pending ? "Creating..." : "Create Batch"}
          defaultValues={emptyForm}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
      {editingItem && (
        <BatchFormModal
          key={editingItem.id} // 👈 این خط بسیار مهم است و فرم را رفرش می‌کند
          title="Edit Batch"
          submitText={pending ? "Saving..." : "Save Changes"}
          defaultValues={{
            id: editingItem.id, // 👈 آیدی حتما باید ارسال شود
            batchNumber: editingItem.batchNumber || "",
            batchDate: editingItem.batchDate ? new Date(editingItem.batchDate).toISOString().split("T")[0] : "",
            description: editingItem.description || "",
            drugProductId: editingItem.drugProductId || "",
          }}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdate}
        />
      )}

    </div>
  );
}
