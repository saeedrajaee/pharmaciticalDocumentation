"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createStep7ScaleUpFinalAction,
  deleteStep7ScaleUpFinalByProjectAction,
  getStep7ScaleUpFinalByProjectAction,
  updateStep7ScaleUpFinalByProjectAction,
} from "@/app/actions/scaleup-final-action";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

const getFileUrl = (path) => {
  if (!path) return "#";
  if (/^https?:\/\//i.test(path)) return path;

  const cleanPath = String(path).replace(/\\/g, "/");
  return `${BACKEND_URL}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

const getFileName = (path) => {
  if (!path) return "";
  const cleanPath = String(path).replace(/\\/g, "/");
  return cleanPath.split("/").pop() || "Download";
};

const isActionError = (res) => res?.error === true || res?.success === false;

const getActionMessage = (res, fallback) => {
  if (res?.message) return res.message;
  if (res?.details) {
    const firstErr = Object.values(res.details)?.[0]?.[0];
    if (firstErr) return firstErr;
  }
  if (res?.error?.formErrors?.[0]) return res.error.formErrors[0];
  return fallback;
};

export default function Step7ScaleUpFinal({ projectId, onDataStatusChange }) {
  const [mounted, setMounted] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create state
  const [isAdding, setIsAdding] = useState(false);
  const [newProductionFile, setNewProductionFile] = useState(null);
  const [newQcFile, setNewQcFile] = useState(null);

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editProductionFile, setEditProductionFile] = useState(null);
  const [editQcFile, setEditQcFile] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // پایش و ارسال وضعیت وجود داده به کامپوننت والد
  useEffect(() => {
    if (mounted && !loading) {
      onDataStatusChange?.(Boolean(record?.id));
    }
  }, [record, mounted, loading, onDataStatusChange]);

  const loadData = async () => {
    if (!projectId) {
      setRecord(null);
      setLoading(false);
      onDataStatusChange?.(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getStep7ScaleUpFinalByProjectAction(Number(projectId));
      setRecord(res && res.id ? res : null);
    } catch (err) {
      console.error("Error loading scale-up final record:", err);
      setRecord(null);
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
    setNewProductionFile(null);
    setNewQcFile(null);
    setIsAdding(false);
  };

  const handleSaveNew = () => {
    if (!newProductionFile && !newQcFile) {
      alert("Please upload at least one technology transfer document.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        if (newProductionFile) {
          formData.append(
            "productionTechnologyTransferDocumentFile",
            newProductionFile
          );
        }
        if (newQcFile) {
          formData.append("technologyTransferDocumentQCFile", newQcFile);
        }

        const res = await createStep7ScaleUpFinalAction(
          Number(projectId),
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to create Scale-Up Final record"));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating scale-up final record:", err);
        alert("An error occurred while saving the scale-up final record.");
      }
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditProductionFile(null);
    setEditQcFile(null);
  };

  const handleSaveEdit = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        if (editProductionFile) {
          formData.append(
            "productionTechnologyTransferDocumentFile",
            editProductionFile
          );
        }
        if (editQcFile) {
          formData.append("technologyTransferDocumentQCFile", editQcFile);
        }

        const res = await updateStep7ScaleUpFinalByProjectAction(
          Number(projectId),
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to update Scale-Up Final record"));
          return;
        }

        setIsEditing(false);
        setEditProductionFile(null);
        setEditQcFile(null);
        await loadData();
      } catch (err) {
        console.error("Error updating scale-up final record:", err);
        alert("An error occurred while updating the scale-up final record.");
      }
    });
  };

  const handleDelete = () => {
    if (
      !window.confirm(
        "Are you sure you want to delete this Scale-Up Final record?"
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteStep7ScaleUpFinalByProjectAction(
          Number(projectId)
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to delete Scale-Up Final record"));
          return;
        }

        setRecord(null);
        setIsEditing(false);
        setIsAdding(false);
        await loadData();
      } catch (err) {
        console.error("Error deleting scale-up final record:", err);
        alert("An error occurred while deleting the scale-up final record.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading Scale-Up Final module...
      </div>
    );
  }

  const hasRecord = !!record?.id;

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
            Step 7: Scale-Up Final
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Technology transfer documentation (Production & QC)
          </p>
        </div>

        {!hasRecord && !isAdding && (
          <button
            type="button"
            disabled={isPending || !projectId}
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
            Add Scale-Up Final
          </button>
        )}
      </div>

      {/* Table Display */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[240px] px-4 py-3">
                Production Technology Transfer Document
              </th>
              <th className="min-w-[240px] px-4 py-3">
                Technology Transfer Document (QC)
              </th>
              <th className="min-w-[140px] px-4 py-3">Created At</th>
              <th className="w-32 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Record Inline Row */}
            {isAdding && !hasRecord && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                <td className="px-4 py-3 align-top">
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewProductionFile(e.target.files?.[0] || null)
                    }
                    className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-blue-800"
                  />
                </td>

                <td className="px-4 py-3 align-top">
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewQcFile(e.target.files?.[0] || null)
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
                <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
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
                    Loading scale-up final record...
                  </div>
                </td>
              </tr>
            ) : !hasRecord && !isAdding ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
                  No scale-up final documentation found for this project.
                </td>
              </tr>
            ) : isEditing ? (
              /* Inline Edit Row */
              <tr className="bg-blue-50/30">
                <td className="px-4 py-3 align-top">
                  {record?.productionTechnologyTransferDocumentFileUrl && (
                    <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[200px]">
                      Current: {getFileName(record.productionTechnologyTransferDocumentFileUrl)}
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={(e) =>
                      setEditProductionFile(e.target.files?.[0] || null)
                    }
                    className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-blue-100 file:px-1.5 file:py-0.5 file:text-[11px]"
                  />
                </td>

                <td className="px-4 py-3 align-top">
                  {record?.technologyTransferDocumentQCFileUrl && (
                    <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[200px]">
                      Current: {getFileName(record.technologyTransferDocumentQCFileUrl)}
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={(e) =>
                      setEditQcFile(e.target.files?.[0] || null)
                    }
                    className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-purple-100 file:px-1.5 file:py-0.5 file:text-[11px]"
                  />
                </td>

                <td className="px-4 py-3 text-xs text-stone-500 align-top">
                  {record?.createdAt
                    ? new Date(record.createdAt).toLocaleDateString()
                    : "-"}
                </td>

                <td className="px-4 py-3 text-center align-top">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveEdit}
                      className="rounded border border-emerald-500/30 bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/25 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setIsEditing(false);
                        setEditProductionFile(null);
                        setEditQcFile(null);
                      }}
                      className="rounded border border-stone-300 bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ) : hasRecord ? (
              /* Display Row */
              <tr className="transition-colors hover:bg-stone-50/80">
                {/* Production Tech Transfer Document */}
                <td className="px-4 py-3">
                  {record.productionTechnologyTransferDocumentFileUrl ? (
                    <a
                      href={getFileUrl(
                        record.productionTechnologyTransferDocumentFileUrl
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      title={getFileName(
                        record.productionTechnologyTransferDocumentFileUrl
                      )}
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
                      Production Tech Transfer
                    </a>
                  ) : (
                    <span className="text-xs italic text-stone-400">
                      Not Uploaded
                    </span>
                  )}
                </td>

                {/* QC Tech Transfer Document */}
                <td className="px-4 py-3">
                  {record.technologyTransferDocumentQCFileUrl ? (
                    <a
                      href={getFileUrl(
                        record.technologyTransferDocumentQCFileUrl
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
                      title={getFileName(
                        record.technologyTransferDocumentQCFileUrl
                      )}
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
                      QC Tech Transfer
                    </a>
                  ) : (
                    <span className="text-xs italic text-stone-400">
                      Not Uploaded
                    </span>
                  )}
                </td>

                {/* Created At */}
                <td className="px-4 py-3 text-stone-500">
                  {record.createdAt
                    ? new Date(record.createdAt).toLocaleDateString()
                    : "-"}
                </td>

                {/* Actions */}
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleStartEdit}
                      className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:opacity-50"
                      title="Edit"
                      aria-label="Edit Scale-Up Final"
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
                      onClick={handleDelete}
                      className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50"
                      title="Delete"
                      aria-label="Delete Scale-Up Final"
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
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
