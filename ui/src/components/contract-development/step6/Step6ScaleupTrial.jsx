"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createStep6ScaleUpTrialAction,
  deleteStep6ScaleUpTrialAction,
  getStep6ScaleUpTrialListAction,
  updateStep6ScaleUpTrialAction,
} from "@/app/actions/scaleup-trial-action";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

const getFileUrl = (path) => {
  if (!path) return "#";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = String(path).replace(/\\/g, "/");
  return `${BACKEND_URL}${
    cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`
  }`;
};

const getFileName = (path) => {
  if (!path) return "";
  const cleanPath = String(path).replace(/\\/g, "/");
  return cleanPath.split("/").pop() || "Download";
};

const isActionError = (res) => {
  return res?.error === true || res?.success === false;
};

const getActionMessage = (res, fallback) => {
  if (res?.message) return res.message;
  if (res?.details) {
    const firstErr = Object.values(res.details)?.[0]?.[0];
    if (firstErr) return firstErr;
  }
  return fallback;
};

export default function Step6ScaleUpTrial({ projectId, onDataStatusChange }) {
  const [mounted, setMounted] = useState(false);
  const [trialList, setTrialList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // State برای افزودن رکورد جدید
  const [isAdding, setIsAdding] = useState(false);
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newProcessDesc, setNewProcessDesc] = useState("");
  const [newReportFile, setNewReportFile] = useState(null);
  const [newProcessFile, setNewProcessFile] = useState(null);

  // State برای ویرایش رکورد موجود
  const [editingId, setEditingId] = useState(null);
  const [editBatchNumber, setEditBatchNumber] = useState("");
  const [editProcessDesc, setEditProcessDesc] = useState("");
  const [editReportFile, setEditReportFile] = useState(null);
  const [editProcessFile, setEditProcessFile] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // پایش و ارسال وضعیت وجود داده به کامپوننت والد
  useEffect(() => {
    if (mounted && !loading) {
      onDataStatusChange?.(trialList.length > 0);
    }
  }, [trialList, mounted, loading, onDataStatusChange]);

  const loadData = async () => {
    if (!projectId) {
      setTrialList([]);
      setLoading(false);
      onDataStatusChange?.(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getStep6ScaleUpTrialListAction(projectId);
      const records = Array.isArray(res) ? res : res?.data;

      if (Array.isArray(records)) {
        setTrialList(records);
      } else if (isActionError(res)) {
        console.error(
          "Error loading scale-up trial records:",
          getActionMessage(res, "Unknown error")
        );
        setTrialList([]);
      } else {
        setTrialList([]);
      }
    } catch (err) {
      console.error("Error loading scale-up trial records:", err);
      setTrialList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [projectId, mounted]);

  const resetNewRow = () => {
    setNewBatchNumber("");
    setNewProcessDesc("");
    setNewReportFile(null);
    setNewProcessFile(null);
    setIsAdding(false);
  };

  const handleSaveNew = () => {
    if (!newBatchNumber.trim()) {
      alert("لطفاً مشخصات یا شرح بچ (Batch Description) را وارد کنید.");
      return;
    }

    if (!newProcessDesc.trim()) {
      alert("لطفاً فرآیند تولید اسکیل‌آپ را وارد کنید.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("batchNumber", newBatchNumber.trim());
        formData.append("scaleUpManufacturingProcess", newProcessDesc.trim());

        if (newReportFile) {
          formData.append("reportFile", newReportFile);
        }
        if (newProcessFile) {
          formData.append("manufacturingProcessFile", newProcessFile);
        }

        const res = await createStep6ScaleUpTrialAction(
          Number(projectId),
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در ثبت آزمون اسکیل‌آپ"));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating scale-up trial record:", err);
        alert("خطا در ثبت آزمون اسکیل‌آپ.");
      }
    });
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditBatchNumber(item.batchNumber || "");
    setEditProcessDesc(item.scaleUpManufacturingProcess || "");
    setEditReportFile(null);
    setEditProcessFile(null);
  };

  const handleSaveEdit = (trialId) => {
    if (!editBatchNumber.trim()) {
      alert("لطفاً شرح بچ را وارد کنید.");
      return;
    }
    if (!editProcessDesc.trim()) {
      alert("لطفاً فرآیند تولید را وارد کنید.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("batchNumber", editBatchNumber.trim());
        formData.append("scaleUpManufacturingProcess", editProcessDesc.trim());

        if (editReportFile) {
          formData.append("reportFile", editReportFile);
        }
        if (editProcessFile) {
          formData.append("manufacturingProcessFile", editProcessFile);
        }

        const res = await updateStep6ScaleUpTrialAction(
          projectId,
          trialId,
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در به‌روزرسانی رکورد اسکیل‌آپ"));
          return;
        }

        setEditingId(null);
        setEditReportFile(null);
        setEditProcessFile(null);
        await loadData();
      } catch (err) {
        console.error("Error updating scale-up trial record:", err);
        alert("خطا در به‌روزرسانی رکورد اسکیل‌آپ.");
      }
    });
  };

  const handleDelete = (trialId) => {
    if (!window.confirm("آیا از حذف این رکورد آزمون اسکیل‌آپ اطمینان دارید؟")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteStep6ScaleUpTrialAction(projectId, trialId);

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در حذف رکورد آزمون اسکیل‌آپ"));
          return;
        }

        await loadData();
      } catch (err) {
        console.error("Error deleting scale-up trial record:", err);
        alert("خطا در حذف رکورد آزمون اسکیل‌آپ.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading Scale-Up Trials module...
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      dir="ltr"
      suppressHydrationWarning
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/80 px-4 py-3.5 backdrop-blur-sm">
        <div>
          <h3 className="text-sm font-bold text-stone-800">
            Step 6: Scale-Up Trials
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Manage scale-up trial batches, manufacturing processes, and trial
            reports
          </p>
        </div>

        <button
          type="button"
          disabled={isAdding || isPending || !projectId}
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50"
        >
          <svg
            className="h-4 w-4 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Scale-Up Trial
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[160px] px-4 py-3">Batch Description</th>
              <th className="min-w-[220px] px-4 py-3">Process Description</th>
              <th className="min-w-[150px] px-4 py-3">MOM</th>
              <th className="min-w-[170px] px-4 py-3">Manufacturing Process</th>
              <th className="min-w-[130px] px-4 py-3">Created At</th>
              <th className="w-32 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Row Input */}
            {isAdding && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                <td className="px-4 py-3 align-top">
                  <input
                    type="text"
                    placeholder="Batch description *"
                    value={newBatchNumber}
                    onChange={(e) => setNewBatchNumber(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>

                <td className="px-4 py-3 align-top">
                  <textarea
                    rows={2}
                    placeholder="Scale-up manufacturing process *"
                    value={newProcessDesc}
                    onChange={(e) => setNewProcessDesc(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>

                <td className="px-4 py-3 align-top">
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewReportFile(e.target.files?.[0] || null)
                    }
                    className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-blue-800"
                  />
                </td>

                <td className="px-4 py-3 align-top">
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewProcessFile(e.target.files?.[0] || null)
                    }
                    className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-purple-100 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-purple-800"
                  />
                </td>

                <td className="px-4 py-3 text-xs italic text-stone-400 align-top">
                  Auto (Now)
                </td>

                <td className="px-4 py-3 text-center align-top">
                  <div className="flex items-center justify-center gap-1.5 pt-0.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveNew}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={resetNewRow}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300/60 bg-stone-500/10 px-2.5 py-1 text-xs font-semibold text-stone-600 shadow-sm transition-all hover:bg-stone-500/20 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Loading State */}
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin text-stone-400"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Loading scale-up trial records...
                  </div>
                </td>
              </tr>
            ) : trialList.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  No scale-up trial records found for this project.
                </td>
              </tr>
            ) : (
              trialList.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30">
                      <td className="px-4 py-3 align-top">
                        <input
                          type="text"
                          value={editBatchNumber}
                          onChange={(e) => setEditBatchNumber(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3 align-top">
                        <textarea
                          rows={3}
                          value={editProcessDesc}
                          onChange={(e) => setEditProcessDesc(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3 align-top">
                        {item.reportFileUrl && (
                          <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[140px]">
                            {getFileName(item.reportFileUrl)}
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditReportFile(e.target.files?.[0] || null)
                          }
                          className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-blue-100 file:px-1.5 file:py-0.5 file:text-[11px]"
                        />
                      </td>

                      <td className="px-4 py-3 align-top">
                        {item.manufacturingProcessFileUrl && (
                          <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[140px]">
                            {getFileName(item.manufacturingProcessFileUrl)}
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditProcessFile(e.target.files?.[0] || null)
                          }
                          className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-blue-100 file:px-1.5 file:py-0.5 file:text-[11px]"
                        />
                      </td>

                      <td className="px-4 py-3 text-xs text-stone-500 align-top">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="px-4 py-3 text-center align-top">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveEdit(item.id)}
                            className="rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/25 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              setEditingId(null);
                              setEditReportFile(null);
                              setEditProcessFile(null);
                            }}
                            className="rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-stone-50/80"
                  >
                    <td className="px-4 py-3 font-semibold text-stone-800">
                      {item.batchNumber}
                    </td>

                    <td className="px-4 py-3 text-stone-600 whitespace-pre-wrap leading-relaxed">
                      {item.scaleUpManufacturingProcess || (
                        <span className="italic text-stone-400">-</span>
                      )}
                    </td>

                    {/* صورت جلسه (Report) */}
                    <td className="px-4 py-3">
                      {item.reportFileUrl ? (
                        <a
                          href={getFileUrl(item.reportFileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          title={getFileName(item.reportFileUrl)}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-3.5-3.5M12 16l3.5-3.5"
                            />
                          </svg>
                          MOM
                        </a>
                      ) : (
                        <span className="text-xs italic text-stone-400">-</span>
                      )}
                    </td>

                    {/* Manufacturing Process File */}
                    <td className="px-4 py-3">
                      {item.manufacturingProcessFileUrl ? (
                        <a
                          href={getFileUrl(item.manufacturingProcessFileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                          title={getFileName(item.manufacturingProcessFileUrl)}
                        >
                          <svg
                            className="h-3.5 w-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-3.5-3.5M12 16l3.5-3.5"
                            />
                          </svg>
                          Manufacturing Process
                        </a>
                      ) : (
                        <span className="text-xs italic text-stone-400">-</span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="px-4 py-3 text-stone-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : "-"}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStartEdit(item)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:opacity-50"
                          title="Edit"
                          aria-label="Edit scale-up trial"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50"
                          title="Delete"
                          aria-label="Delete scale-up trial"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
