"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createStep2FormulaBomAction,
  deleteStep2FormulaBomAction,
  getStep2FormulaBomListAction,
  updateStep2FormulaBomAction,
} from "@/app/actions/bom-action";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

const getFileUrl = (path) => {
  if (!path) return "#";

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const cleanPath = String(path).replace(/\\/g, "/");

  return `${BACKEND_URL}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

const getFileName = (path) => {
  if (!path) return "";

  const cleanPath = String(path).replace(/\\/g, "/");
  return cleanPath.split("/").pop() || "BOM file";
};

const isActionError = (res) => {
  // اکشن‌های قبلی ممکن است خروجی را با error یا success برگردانند.
  return res?.error === true || res?.success === false;
};

const getActionMessage = (res, fallback) =>
  res?.message || res?.error || fallback;

export default function Step1BOM({ projectId }) {
  const [mounted, setMounted] = useState(false);
  const [bomList, setBomList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isAdding, setIsAdding] = useState(false);
  const [newFile, setNewFile] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [editFile, setEditFile] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!projectId) {
      setBomList([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const res = await getStep2FormulaBomListAction(projectId);

      // اکشن ممکن است آرایه را مستقیم یا در data برگرداند.
      const records = Array.isArray(res) ? res : res?.data;

      if (Array.isArray(records)) {
        setBomList(records);
      } else if (isActionError(res)) {
        console.error(
          "Error loading BOM records:",
          getActionMessage(res, "Unknown error")
        );
        setBomList([]);
      } else {
        setBomList([]);
      }
    } catch (err) {
      console.error("Error loading BOM records:", err);
      setBomList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
    }
    // loadData عمداً در dependency قرار نگرفته تا در هر رندر دوباره ساخته نشود.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, mounted]);

  const resetNewRow = () => {
    setNewFile(null);
    setIsAdding(false);
  };

  const handleSaveNew = () => {
    if (!newFile) {
      alert("لطفاً فایل BOM را انتخاب نمایید.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();

        // نام فیلد باید با FileInterceptor('file') در کنترلر NestJS هماهنگ باشد.
        formData.append("file", newFile);

        const res = await createStep2FormulaBomAction(projectId, formData);

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در ثبت فایل BOM."));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating BOM record:", err);
        alert("خطا در ثبت فایل BOM.");
      }
    });
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditFile(null);
  };

  const handleSaveEdit = (bomId) => {
    startTransition(async () => {
      try {
        const formData = new FormData();

        // اگر فایل جدید انتخاب نشده باشد، فایل قبلی حفظ می‌شود.
        if (editFile) {
          formData.append("file", editFile);
        }

        const res = await updateStep2FormulaBomAction(
          projectId,
          bomId,
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در به‌روزرسانی فایل BOM."));
          return;
        }

        setEditingId(null);
        setEditFile(null);
        await loadData();
      } catch (err) {
        console.error("Error updating BOM record:", err);
        alert("خطا در به‌روزرسانی فایل BOM.");
      }
    });
  };

  const handleDelete = (bomId) => {
    if (!window.confirm("آیا از حذف این فایل BOM اطمینان دارید؟")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteStep2FormulaBomAction(projectId, bomId);

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در حذف فایل BOM."));
          return;
        }

        await loadData();
      } catch (err) {
        console.error("Error deleting BOM record:", err);
        alert("خطا در حذف فایل BOM.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading BOM module...
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
            Step 1: Formula BOM
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Upload and manage the project formula BOM file
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
          Add BOM File
        </button>
      </div>

      {/* BOM Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[240px] px-4 py-3">BOM File</th>
              <th className="min-w-[180px] px-4 py-3">Uploaded At</th>
              <th className="w-36 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New BOM Input Row */}
            {isAdding && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                <td className="px-4 py-3" colSpan={2}>
                  <input
                    type="file"
                    onChange={(e) => setNewFile(e.target.files?.[0] || null)}
                    className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
                  />
                  {newFile && (
                    <p className="mt-1.5 text-xs text-stone-500">
                      Selected: {newFile.name}
                    </p>
                  )}
                </td>

                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveNew}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                    >
                      <svg
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Save
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={resetNewRow}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300/60 bg-stone-500/10 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-all hover:bg-stone-500/20 active:scale-95 disabled:opacity-50"
                    >
                      <svg
                        className="h-3.5 w-3.5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Loading State */}
            {loading ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-400">
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
                    Loading BOM records...
                  </div>
                </td>
              </tr>
            ) : bomList.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-stone-400">
                  No BOM files found for this project yet.
                </td>
              </tr>
            ) : (
              bomList.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30">
                      <td className="px-4 py-3" colSpan={2}>
                        {item.bomFileUrl && (
                          <div className="mb-2">
                            <a
                              href={getFileUrl(item.bomFileUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline"
                            >
                              Current file: {getFileName(item.bomFileUrl)}
                            </a>
                          </div>
                        )}

                        <input
                          type="file"
                          onChange={(e) =>
                            setEditFile(e.target.files?.[0] || null)
                          }
                          className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
                        />

                        <p className="mt-1.5 text-xs text-stone-400">
                          Select a file only if you want to replace the current
                          one.
                        </p>

                        {editFile && (
                          <p className="mt-1 text-xs text-stone-500">
                            New file: {editFile.name}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveEdit(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                          >
                            <svg
                              className="h-3.5 w-3.5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            Save
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => {
                              setEditingId(null);
                              setEditFile(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-300/60 bg-stone-500/10 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-all hover:bg-stone-500/20 active:scale-95 disabled:opacity-50"
                          >
                            <svg
                              className="h-3.5 w-3.5 shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2.5"
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
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
                    <td className="px-4 py-3">
                      {item.bomFileUrl ? (
                        <a
                          href={getFileUrl(item.bomFileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-fit items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
                        >
                          <svg
                            className="h-4 w-4 shrink-0 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-3.5-3.5M12 16l3.5-3.5"
                            />
                          </svg>
                          <span>{getFileName(item.bomFileUrl)}</span>
                        </a>
                      ) : (
                        <span className="text-xs italic text-stone-400">
                          No attachment
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-stone-600">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : <span className="italic text-stone-400">-</span>}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStartEdit(item)}
                          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:opacity-50"
                          title="Replace BOM file"
                          aria-label="Replace BOM file"
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
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50"
                          title="Delete"
                          aria-label="Delete BOM file"
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
