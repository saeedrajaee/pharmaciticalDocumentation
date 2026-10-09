"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createStep8CtdModuleAction,
  deleteStep8CtdModuleByProjectAction,
  getStep8CtdModuleByProjectAction,
  updateStep8CtdModuleByProjectAction,
} from "@/app/actions/ctd-action"; // مسیر را مطابق پروژه خودتان تنظیم کنید

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
  const fieldErrors = res?.error?.fieldErrors;
  if (fieldErrors && typeof fieldErrors === "object") {
    const firstKey = Object.keys(fieldErrors)[0];
    const firstMsg = fieldErrors?.[firstKey]?.[0];
    if (firstMsg) return firstMsg;
  }
  return fallback;
};

export default function Step8CtdModule({ projectId, onDataStatusChange }) {
  const [mounted, setMounted] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Create state
  const [isAdding, setIsAdding] = useState(false);
  const [newCtdFile, setNewCtdFile] = useState(null);
  const [newCtdFileUrl, setNewCtdFileUrl] = useState("");
  const [newFdaLetterFile, setNewFdaLetterFile] = useState(null);
  const [newFdaLetterFileUrl, setNewFdaLetterFileUrl] = useState("");
  const [newFdaApproval, setNewFdaApproval] = useState("");
  const [newFdaApprovalLetterNumber, setNewFdaApprovalLetterNumber] = useState("");

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editCtdFile, setEditCtdFile] = useState(null);
  const [editCtdFileUrl, setEditCtdFileUrl] = useState("");
  const [editFdaLetterFile, setEditFdaLetterFile] = useState(null);
  const [editFdaLetterFileUrl, setEditFdaLetterFileUrl] = useState("");
  const [editFdaApproval, setEditFdaApproval] = useState("");
  const [editFdaApprovalLetterNumber, setEditFdaApprovalLetterNumber] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // پایش و ارسال وضعیت وجود داده به کامپوننت والد
  useEffect(() => {
    if (mounted && !loading) {
      onDataStatusChange?.(Boolean(record));
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
      const res = await getStep8CtdModuleByProjectAction(Number(projectId));
      setRecord(
        res && (res.id || res.ctdFileUrl || res.fdaApprovalLetterNumber || res.fdaApproval)
          ? res
          : null
      );
    } catch (err) {
      console.error("Error loading CTD module record:", err);
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
    setNewCtdFile(null);
    setNewCtdFileUrl("");
    setNewFdaLetterFile(null);
    setNewFdaLetterFileUrl("");
    setNewFdaApproval("");
    setNewFdaApprovalLetterNumber("");
    setIsAdding(false);
  };

  const handleSaveNew = () => {
    const hasData =
      newCtdFile ||
      String(newCtdFileUrl).trim() ||
      newFdaLetterFile ||
      String(newFdaLetterFileUrl).trim() ||
      String(newFdaApproval).trim() ||
      String(newFdaApprovalLetterNumber).trim();

    if (!hasData) {
      alert("Please upload at least one file or provide CTD/FDA information.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        if (newCtdFile) formData.append("ctdFile", newCtdFile);
        if (String(newCtdFileUrl).trim())
          formData.append("ctdFileUrl", String(newCtdFileUrl).trim());

        if (newFdaLetterFile)
          formData.append("fdaApprovalLetterFile", newFdaLetterFile);
        if (String(newFdaLetterFileUrl).trim()) {
          formData.append(
            "fdaApprovalLetterFileUrl",
            String(newFdaLetterFileUrl).trim()
          );
        }

        if (String(newFdaApproval).trim()) {
          formData.append("fdaApproval", new Date(newFdaApproval).toISOString());
        }
        if (String(newFdaApprovalLetterNumber).trim()) {
          formData.append(
            "fdaApprovalLetterNumber",
            String(newFdaApprovalLetterNumber).trim()
          );
        }

        const res = await createStep8CtdModuleAction(
          Number(projectId),
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to create CTD Module record"));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating CTD module record:", err);
        alert("An error occurred while saving the CTD module record.");
      }
    });
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditCtdFile(null);
    setEditCtdFileUrl(record?.ctdFileUrl || "");
    setEditFdaLetterFile(null);
    setEditFdaLetterFileUrl(record?.fdaApprovalLetterFileUrl || "");
    setEditFdaApprovalLetterNumber(record?.fdaApprovalLetterNumber || "");

    if (record?.fdaApproval) {
      try {
        const d = new Date(record.fdaApproval);
        if (!Number.isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          setEditFdaApproval(`${yyyy}-${mm}-${dd}`);
        } else {
          setEditFdaApproval("");
        }
      } catch {
        setEditFdaApproval("");
      }
    } else {
      setEditFdaApproval("");
    }
  };

  const handleSaveEdit = () => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        if (editCtdFile) formData.append("ctdFile", editCtdFile);
        if (String(editCtdFileUrl).trim())
          formData.append("ctdFileUrl", String(editCtdFileUrl).trim());

        if (editFdaLetterFile)
          formData.append("fdaApprovalLetterFile", editFdaLetterFile);
        if (String(editFdaLetterFileUrl).trim()) {
          formData.append(
            "fdaApprovalLetterFileUrl",
            String(editFdaLetterFileUrl).trim()
          );
        }

        if (String(editFdaApproval).trim()) {
          formData.append("fdaApproval", new Date(editFdaApproval).toISOString());
        }
        if (String(editFdaApprovalLetterNumber).trim()) {
          formData.append(
            "fdaApprovalLetterNumber",
            String(editFdaApprovalLetterNumber).trim()
          );
        }

        const res = await updateStep8CtdModuleByProjectAction(
          Number(projectId),
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to update CTD Module record"));
          return;
        }

        setIsEditing(false);
        setEditCtdFile(null);
        setEditFdaLetterFile(null);
        await loadData();
      } catch (err) {
        console.error("Error updating CTD module record:", err);
        alert("An error occurred while updating the CTD module record.");
      }
    });
  };

  const handleDelete = () => {
    if (
      !window.confirm("Are you sure you want to delete this CTD Module record?")
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteStep8CtdModuleByProjectAction(Number(projectId));

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to delete CTD Module record"));
          return;
        }

        setRecord(null);
        setIsEditing(false);
        setIsAdding(false);
        await loadData();
      } catch (err) {
        console.error("Error deleting CTD module record:", err);
        alert("An error occurred while deleting the CTD module record.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading CTD Module...
      </div>
    );
  }

  const hasRecord = !!record;
  const ctdFilePath =
    record?.ctdFilePath || record?.ctdFile || record?.ctdFileUrl || null;
  const fdaLetterFilePath =
    record?.fdaApprovalLetterFilePath ||
    record?.fdaApprovalLetterFile ||
    record?.fdaApprovalLetterFileUrl ||
    null;

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
            Step 8: CTD Module
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            CTD module documentation & FDA approval records
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
            Add CTD Record
          </button>
        )}
      </div>

      {/* Table Display */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[240px] px-4 py-3">CTD Module Document</th>
              <th className="min-w-[240px] px-4 py-3">FDA Approval Letter</th>
              <th className="min-w-[180px] px-4 py-3">FDA Info</th>
              <th className="w-32 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Record Inline Row */}
            {isAdding && !hasRecord && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                {/* CTD File Input */}
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1.5">
                    <input
                      type="file"
                      onChange={(e) =>
                        setNewCtdFile(e.target.files?.[0] || null)
                      }
                      className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-blue-800"
                    />
                    <input
                      type="text"
                      placeholder="CTD URL (optional)"
                      value={newCtdFileUrl}
                      onChange={(e) => setNewCtdFileUrl(e.target.value)}
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </td>

                {/* FDA Letter File Input */}
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1.5">
                    <input
                      type="file"
                      onChange={(e) =>
                        setNewFdaLetterFile(e.target.files?.[0] || null)
                      }
                      className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-purple-100 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-purple-800"
                    />
                    <input
                      type="text"
                      placeholder="FDA Letter URL (optional)"
                      value={newFdaLetterFileUrl}
                      onChange={(e) => setNewFdaLetterFileUrl(e.target.value)}
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </td>

                {/* FDA Metadata Inputs */}
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={newFdaApproval}
                      onChange={(e) => setNewFdaApproval(e.target.value)}
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Letter No."
                      value={newFdaApprovalLetterNumber}
                      onChange={(e) =>
                        setNewFdaApprovalLetterNumber(e.target.value)
                      }
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </td>

                {/* Actions */}
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
                    Loading CTD module record...
                  </div>
                </td>
              </tr>
            ) : !hasRecord && !isAdding ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-stone-400">
                  No CTD module documentation found for this project.
                </td>
              </tr>
            ) : isEditing ? (
              /* Inline Edit Row */
              <tr className="bg-blue-50/30">
                {/* CTD File Edit */}
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1.5">
                    {ctdFilePath && (
                      <div className="text-[11px] text-stone-500 truncate max-w-[200px]">
                        Current: {getFileName(ctdFilePath)}
                      </div>
                    )}
                    <input
                      type="file"
                      onChange={(e) =>
                        setEditCtdFile(e.target.files?.[0] || null)
                      }
                      className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-blue-100 file:px-1.5 file:py-0.5 file:text-[11px]"
                    />
                    <input
                      type="text"
                      value={editCtdFileUrl}
                      onChange={(e) => setEditCtdFileUrl(e.target.value)}
                      placeholder="CTD URL (optional)"
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </td>

                {/* FDA Letter Edit */}
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1.5">
                    {fdaLetterFilePath && (
                      <div className="text-[11px] text-stone-500 truncate max-w-[200px]">
                        Current: {getFileName(fdaLetterFilePath)}
                      </div>
                    )}
                    <input
                      type="file"
                      onChange={(e) =>
                        setEditFdaLetterFile(e.target.files?.[0] || null)
                      }
                      className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-purple-100 file:px-1.5 file:py-0.5 file:text-[11px]"
                    />
                    <input
                      type="text"
                      value={editFdaLetterFileUrl}
                      onChange={(e) => setEditFdaLetterFileUrl(e.target.value)}
                      placeholder="FDA Letter URL (optional)"
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                </td>

                {/* FDA Metadata Edit */}
                <td className="px-4 py-3 align-top">
                  <div className="space-y-1.5">
                    <input
                      type="date"
                      value={editFdaApproval}
                      onChange={(e) => setEditFdaApproval(e.target.value)}
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                    <input
                      type="text"
                      placeholder="Letter No."
                      value={editFdaApprovalLetterNumber}
                      onChange={(e) =>
                        setEditFdaApprovalLetterNumber(e.target.value)
                      }
                      className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </td>

                {/* Actions */}
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
                        setEditCtdFile(null);
                        setEditFdaLetterFile(null);
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
                {/* CTD Document */}
                <td className="px-4 py-3">
                  {ctdFilePath ? (
                    <a
                      href={getFileUrl(ctdFilePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                      title={getFileName(ctdFilePath)}
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
                      CTD Module File
                    </a>
                  ) : (
                    <span className="text-xs italic text-stone-400">
                      Not Uploaded
                    </span>
                  )}
                </td>

                {/* FDA Approval Letter */}
                <td className="px-4 py-3">
                  {fdaLetterFilePath ? (
                    <a
                      href={getFileUrl(fdaLetterFilePath)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-700 hover:bg-purple-100"
                      title={getFileName(fdaLetterFilePath)}
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
                      FDA Approval Letter
                    </a>
                  ) : (
                    <span className="text-xs italic text-stone-400">
                      Not Uploaded
                    </span>
                  )}
                </td>

                {/* FDA Information & Date */}
                <td className="px-4 py-3 text-stone-600">
                  <div className="space-y-0.5 text-xs">
                    {record?.fdaApprovalLetterNumber && (
                      <div className="font-medium text-stone-800">
                        No:{" "}
                        <span className="font-normal text-stone-600">
                          {record.fdaApprovalLetterNumber}
                        </span>
                      </div>
                    )}
                    {record?.fdaApproval && (
                      <div className="text-[11px] text-stone-500">
                        Date: {new Date(record.fdaApproval).toLocaleDateString()}
                      </div>
                    )}
                    {!record?.fdaApprovalLetterNumber && !record?.fdaApproval && (
                      <span className="text-xs italic text-stone-400">-</span>
                    )}
                  </div>
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
                      aria-label="Edit CTD Module"
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
                      aria-label="Delete CTD Module"
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
