"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  getStudiesAction,
  createStudyAction,
  deleteStudyAction,
  updateStudyAction,
} from "@/app/actions/study-action";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

const getFileUrl = (path) => {
  if (!path) return "#";
  if (path.startsWith("http")) return path;
  const cleanPath = String(path).replace(/\\/g, "/");
  return `${BACKEND_URL}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

export default function Step1StudiesSection({ projectId }) {
  const [mounted, setMounted] = useState(false);
  const [studies, setStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // New row being added
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    type: "PATENT",
    title: "",
    reference: "",
    summary: "",
    file: null,
  });

  // Active editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const data = await getStudiesAction(projectId);
      if (Array.isArray(data)) {
        setStudies(data);
      }
    } catch (err) {
      console.error("Error loading studies:", err);
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
    if (!newRow.title.trim() || !newRow.reference.trim()) {
      alert("Please provide both a title and reference for the study.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("type", newRow.type);
      formData.append("title", newRow.title.trim());
      formData.append("reference", newRow.reference.trim());
      if (newRow.summary?.trim()) formData.append("summary", newRow.summary.trim());
      if (newRow.file) formData.append("file", newRow.file);

      const res = await createStudyAction(projectId, formData);
      if (res?.error) {
        alert(res.message || "Failed to create study record.");
      } else {
        setIsAdding(false);
        setNewRow({ type: "PATENT", title: "", reference: "", summary: "", file: null });
        await loadData();
      }
    });
  };

  const handleStartEdit = (study) => {
    setEditingId(study.id);
    setEditForm({
      type: study.type || "PATENT",
      title: study.title || "",
      reference: study.reference || "",
      summary: study.summary || "",
      file: null,
    });
  };

  const handleSaveEdit = (studyId) => {
    if (!editForm.title?.trim() || !editForm.reference?.trim()) {
      alert("Please provide both a title and reference.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("type", editForm.type);
      formData.append("title", editForm.title.trim());
      formData.append("reference", editForm.reference.trim());
      if (editForm.summary !== undefined) formData.append("summary", editForm.summary.trim());
      if (editForm.file) formData.append("file", editForm.file);

      const res = await updateStudyAction(projectId, studyId, formData);
      if (res?.error) {
        alert(res.message || "Failed to update study record.");
      } else {
        setEditingId(null);
        await loadData();
      }
    });
  };

  const handleDelete = (studyId) => {
    if (!window.confirm("Are you sure you want to delete this study record?")) return;

    startTransition(async () => {
      const res = await deleteStudyAction(projectId, studyId);
      if (res?.error) {
        alert(res.message || "Failed to delete record.");
      } else {
        await loadData();
      }
    });
  };

  const renderBadge = (type) => {
    const badges = {
      PATENT: "bg-amber-100 text-amber-800 border-amber-300",
      ARTICLE: "bg-blue-100 text-blue-800 border-blue-300",
      PHARMACOPOEIA: "bg-emerald-100 text-emerald-800 border-emerald-300",
      INTERNAL_REPORT: "bg-purple-100 text-purple-800 border-purple-300",
      OTHER: "bg-stone-100 text-stone-700 border-stone-300",
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
          badges[type] || badges.OTHER
        }`}
      >
        {type}
      </span>
    );
  };

  // جلوگیری از Hydration mismatch تا زمان مانت کامل کلاینت
  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading literature study module...
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
      <div className="flex flex-wrap items-center justify-between border-b border-stone-200 bg-stone-50/80 px-4 py-3.5 gap-2">
        <div>
          <h3 className="text-sm font-bold text-stone-800">Step 1: Literature Study</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Patents, reference articles, pharmacopoeias, and formulation documents
          </p>
        </div>
        <button
          type="button"
          disabled={isAdding || isPending || !projectId}
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 transition-all"
        >
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Add New Study
        </button>
      </div>

      {/* Studies Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="bg-stone-100/70 text-stone-700 font-bold border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 w-36">Document Type</th>
              <th className="px-4 py-3 min-w-[200px]">Study Title</th>
              <th className="px-4 py-3 min-w-[160px]">Reference / DOI / Patent No.</th>
              <th className="px-4 py-3 min-w-[180px]">Attachment</th>
              <th className="px-4 py-3 w-36 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Study Input Row */}
            {isAdding && (
              <tr className="bg-blue-50/40 border-b-2 border-blue-200">
                <td className="px-4 py-3">
                  <select
                    value={newRow.type}
                    onChange={(e) => setNewRow({ ...newRow, type: e.target.value })}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="PATENT">Patent</option>
                    <option value="ARTICLE">Article</option>
                    <option value="PHARMACOPOEIA">Pharmacopoeia</option>
                    <option value="INTERNAL_REPORT">Internal Report</option>
                    <option value="OTHER">Other</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Article or patent title..."
                    value={newRow.title}
                    onChange={(e) => setNewRow({ ...newRow, title: e.target.value })}
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="USP / EP / Patent number..."
                    value={newRow.reference}
                    onChange={(e) => setNewRow({ ...newRow, reference: e.target.value })}
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) => setNewRow({ ...newRow, file: e.target.files?.[0] || null })}
                    className="block w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveNew}
                      className="inline-flex items-center gap-1 rounded-lg backdrop-blur-md bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setIsAdding(false)}
                      className="inline-flex items-center gap-1 rounded-lg backdrop-blur-md bg-stone-500/10 text-stone-600 border border-stone-300/60 hover:bg-stone-500/20 active:scale-95 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
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
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  Loading studies...
                </td>
              </tr>
            ) : studies.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  No studies or references recorded for this project yet.
                </td>
              </tr>
            ) : (
              studies.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30">
                      <td className="px-4 py-3">
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="PATENT">Patent</option>
                          <option value="ARTICLE">Article</option>
                          <option value="PHARMACOPOEIA">Pharmacopoeia</option>
                          <option value="INTERNAL_REPORT">Internal Report</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.title}
                          onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.reference}
                          onChange={(e) => setEditForm({ ...editForm, reference: e.target.value })}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="file"
                          onChange={(e) => setEditForm({ ...editForm, file: e.target.files?.[0] || null })}
                          className="block w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveEdit(item.id)}
                            className="inline-flex items-center gap-1 rounded-lg backdrop-blur-md bg-emerald-500/15 text-emerald-700 border border-emerald-500/30 hover:bg-emerald-500/25 active:scale-95 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setEditingId(null)}
                            className="inline-flex items-center gap-1 rounded-lg backdrop-blur-md bg-stone-500/10 text-stone-600 border border-stone-300/60 hover:bg-stone-500/20 active:scale-95 px-3 py-1.5 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                          >
                            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr key={item.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="px-4 py-3">{renderBadge(item.type)}</td>
                    <td className="px-4 py-3 font-semibold text-stone-800">
                      <div>{item.title}</div>
                      {item.summary && (
                        <div className="text-xs text-stone-400 font-normal line-clamp-1 mt-0.5">
                          {item.summary}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600 font-mono text-xs">{item.reference}</td>
                    <td className="px-4 py-3">
                      {item.fileUrl ? (
                        <a
                          href={getFileUrl(item.fileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-colors w-fit"
                        >
                          <svg
                            className="w-4 h-4 shrink-0 text-blue-600"
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
                          <span>View Attachment</span>
                        </a>
                      ) : (
                        <span className="text-xs text-stone-400 italic">No attachment</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStartEdit(item)}
                          className="text-emerald-600 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
                          title="Edit"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className="text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete"
                        >
                          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
