"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  getFinishedCoaListAction,
  createFinishedCoaAction,
  deleteFinishedCoaAction,
  updateFinishedCoaAction,
} from "@/app/actions/formulation-materials-action";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

const getFileUrl = (path) => {
  if (!path) return "#";
  if (path.startsWith("http")) return path;
  const cleanPath = String(path).replace(/\\/g, "/");
  return `${BACKEND_URL}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

export default function Step3FinishedCoaSection({ projectId, onDataStatusChange }) {
  const [mounted, setMounted] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // ردیف جدید در حال افزودن
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    stdName: "",
    resultFormulationMaterials: true,
    description: "",
    file: null,
  });

  // وضعیت ردیف در حال ویرایش
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // پایش و ارسال وضعیت وجود داده به کامپوننت والد
  useEffect(() => {
    if (mounted && !loading) {
      onDataStatusChange?.(coaList.length > 0);
    }
  }, [coaList, mounted, loading, onDataStatusChange]);

  const loadData = async () => {
    if (!projectId) {
      setCoaList([]);
      setLoading(false);
      onDataStatusChange?.(false);
      return;
    }

    setLoading(true);
    try {
      const data = await getFinishedCoaListAction(projectId);
      if (Array.isArray(data)) {
        setCoaList(data);
      } else {
        setCoaList([]);
      }
    } catch (err) {
      console.error("Error loading Finished COA records:", err);
      setCoaList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && mounted) {
      loadData();
    }
  }, [projectId, mounted]);

  const handleSaveNew = () => {
    if (!newRow.stdName.trim()) {
      alert("لطفاً نام استاندارد (Material Name) را وارد نمایید.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("stdName", newRow.stdName.trim());
      formData.append(
        "resultFormulationMaterials",
        String(newRow.resultFormulationMaterials)
      );

      if (newRow.description?.trim()) {
        formData.append("description", newRow.description.trim());
      }

      if (newRow.file) {
        // کلید file مطابق با کنترلر NestJS (FileInterceptor('file'))
        formData.append("file", newRow.file);
      }

      const res = await createFinishedCoaAction(projectId, formData);

      if (res?.error) {
        alert(res.message || "خطا در ثبت رکورد COA.");
      } else {
        setIsAdding(false);
        setNewRow({
          stdName: "",
          resultFormulationMaterials: true,
          description: "",
          file: null,
        });
        await loadData();
      }
    });
  };

  const handleStartEdit = (coa) => {
    setEditingId(coa.id);
    setEditForm({
      stdName: coa.stdName || "",
      resultFormulationMaterials: coa.resultFormulationMaterials ?? true,
      description: coa.description || "",
      file: null,
    });
  };

  const handleSaveEdit = (coaId) => {
    if (!editForm.stdName?.trim()) {
      alert("لطفاً نام استاندارد (Material Name) را وارد نمایید.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("stdName", editForm.stdName.trim());
      formData.append(
        "resultFormulationMaterials",
        String(editForm.resultFormulationMaterials)
      );

      if (editForm.description !== undefined) {
        formData.append("description", editForm.description.trim());
      }

      if (editForm.file) {
        formData.append("file", editForm.file);
      }

      const res = await updateFinishedCoaAction(projectId, coaId, formData);

      if (res?.error) {
        alert(res.message || "خطا در به‌روزرسانی رکورد COA.");
      } else {
        setEditingId(null);
        await loadData();
      }
    });
  };

  const handleDelete = (coaId) => {
    if (!window.confirm("آیا از حذف این رکورد COA اطمینان دارید؟")) return;

    startTransition(async () => {
      const res = await deleteFinishedCoaAction(projectId, coaId);

      if (res?.error) {
        alert(res.message || "خطا در حذف رکورد COA.");
      } else {
        await loadData();
      }
    });
  };

  const renderBadge = (isApproved) => {
    const approved = isApproved === true || isApproved === "true";

    return approved ? (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-100/80 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 shadow-sm backdrop-blur-sm">
        <svg className="h-3 w-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
        </svg>
        Pass (Approved)
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100/80 px-2.5 py-0.5 text-xs font-semibold text-rose-800 shadow-sm backdrop-blur-sm">
        <svg className="h-3 w-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
        </svg>
        Fail (Rejected)
      </span>
    );
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading finished product COA module...
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
            Step 3: Finished Product COA
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Certificate of Analysis for formulation materials — name, Approved,
            description, and attachment
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
          Add New COA
        </button>
      </div>

      {/* COA Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[160px] px-4 py-3">Standard Material Name</th>
              <th className="w-40 px-4 py-3">Approved</th>
              <th className="min-w-[200px] px-4 py-3">Description</th>
              <th className="min-w-[170px] px-4 py-3">Attachment</th>
              <th className="w-36 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New COA Input Row */}
            {isAdding && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Enter standard material name..."
                    value={newRow.stdName}
                    onChange={(e) =>
                      setNewRow({ ...newRow, stdName: e.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>

                <td className="px-4 py-3">
                  <select
                    value={String(newRow.resultFormulationMaterials)}
                    onChange={(e) =>
                      setNewRow({
                        ...newRow,
                        resultFormulationMaterials: e.target.value === "true",
                      })
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="true">Approved (Pass)</option>
                    <option value="false">Rejected (Fail)</option>
                  </select>
                </td>

                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Description / notes..."
                    value={newRow.description}
                    onChange={(e) =>
                      setNewRow({ ...newRow, description: e.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewRow({
                        ...newRow,
                        file: e.target.files?.[0] || null,
                      })
                    }
                    className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
                  />
                </td>

                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveNew}
                      className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-md transition-all hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
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
                      onClick={() => setIsAdding(false)}
                      className="inline-flex items-center gap-1 rounded-lg border border-stone-300/60 bg-stone-500/10 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm backdrop-blur-md transition-all hover:bg-stone-500/20 active:scale-95 disabled:opacity-50"
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
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-stone-400"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin text-stone-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Loading finished product COA records...
                  </div>
                </td>
              </tr>
            ) : coaList.length === 0 && !isAdding ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-stone-400"
                >
                  No finished product COA records found for this project yet.
                </td>
              </tr>
            ) : (
              coaList.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.stdName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              stdName: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={String(editForm.resultFormulationMaterials)}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              resultFormulationMaterials:
                                e.target.value === "true",
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="true">Approved (Pass)</option>
                          <option value="false">Rejected (Fail)</option>
                        </select>
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.description}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              description: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              file: e.target.files?.[0] || null,
                            })
                          }
                          className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveEdit(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm backdrop-blur-md transition-all hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
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
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 rounded-lg border border-stone-300/60 bg-stone-500/10 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm backdrop-blur-md transition-all hover:bg-stone-500/20 active:scale-95 disabled:opacity-50"
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
                    <td className="px-4 py-3 font-semibold text-stone-800">
                      {item.stdName}
                    </td>

                    <td className="px-4 py-3">
                      {renderBadge(item.resultFormulationMaterials)}
                    </td>

                    <td className="px-4 py-3 text-stone-600">
                      {item.description || (
                        <span className="italic text-stone-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {item.stdFileUrl ? (
                        <a
                          href={getFileUrl(item.stdFileUrl)}
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
                          <span>View COA</span>
                        </a>
                      ) : (
                        <span className="text-xs italic text-stone-400">
                          No attachment
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStartEdit(item)}
                          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:opacity-50"
                          title="Edit"
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
