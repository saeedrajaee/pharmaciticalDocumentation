"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  createPackagingAction,
  deletePackagingAction,
  getPackagingListAction,
  updatePackagingAction,
} from "@/app/actions/pre-furmola-packaging-action";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

const getFileUrl = (path) => {
  if (!path) return "#";
  if (path.startsWith("http")) return path;
  const cleanPath = String(path).replace(/\\/g, "/");
  return `${BACKEND_URL}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

const getFileName = (path, fallback = "File") => {
  if (!path) return fallback;
  const cleanPath = String(path).replace(/\\/g, "/");
  return cleanPath.split("/").pop() || fallback;
};

const isActionError = (res) => res?.error === true || res?.success === false;
const getActionMessage = (res, fallback) =>
  res?.message || res?.error || fallback;

export default function Step4Packaging({ projectId }) {
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // New row being added
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({
    packaagingName: "",
    manufactor: "",
    coaFile: null,
    ursFile: null,
  });

  // Active editing state
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    packaagingName: "",
    manufactor: "",
    coaFile: null,
    ursFile: null,
    currentCoa: "",
    currentUrs: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!projectId) {
      setList([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getPackagingListAction(projectId);
      const records = Array.isArray(res) ? res : res?.data;
      if (Array.isArray(records)) {
        setList(records);
      } else {
        setList([]);
      }
    } catch (err) {
      console.error("Error loading Packaging records:", err);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && mounted) {
      loadData();
    }
  }, [projectId, mounted]);

  const resetNewRow = () => {
    setNewRow({
      packaagingName: "",
      manufactor: "",
      coaFile: null,
      ursFile: null,
    });
    setIsAdding(false);
  };

  const handleSaveNew = () => {
    if (!newRow.packaagingName.trim()) {
      alert("Please provide a Packaging Name.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("packaagingName", newRow.packaagingName.trim());
        if (newRow.manufactor?.trim()) {
          formData.append("manufactor", newRow.manufactor.trim());
        }
        if (newRow.coaFile) formData.append("coaFile", newRow.coaFile);
        if (newRow.ursFile) formData.append("ursFile", newRow.ursFile);

        const res = await createPackagingAction(projectId, formData);

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to create packaging record."));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating Packaging record:", err);
        alert("Failed to create packaging record.");
      }
    });
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditForm({
      packaagingName: item.packaagingName || "",
      manufactor: item.manufactor || "",
      coaFile: null,
      ursFile: null,
      currentCoa: item.coa || "",
      currentUrs: item.urs || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({
      packaagingName: "",
      manufactor: "",
      coaFile: null,
      ursFile: null,
      currentCoa: "",
      currentUrs: "",
    });
  };

  const handleSaveEdit = (id) => {
    if (!editForm.packaagingName?.trim()) {
      alert("Please provide a Packaging Name.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("packaagingName", editForm.packaagingName.trim());
        if (editForm.manufactor !== undefined) {
          formData.append("manufactor", editForm.manufactor.trim());
        }
        if (editForm.coaFile) formData.append("coaFile", editForm.coaFile);
        if (editForm.ursFile) formData.append("ursFile", editForm.ursFile);

        const res = await updatePackagingAction(projectId, id, formData);

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to update packaging record."));
          return;
        }

        handleCancelEdit();
        await loadData();
      } catch (err) {
        console.error("Error updating Packaging record:", err);
        alert("Failed to update packaging record.");
      }
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this packaging record?")) return;

    startTransition(async () => {
      try {
        const res = await deletePackagingAction(projectId, id);
        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to delete record."));
          return;
        }
        await loadData();
      } catch (err) {
        console.error("Error deleting Packaging record:", err);
        alert("Failed to delete record.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading Packaging module...
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
          <h3 className="text-sm font-bold text-stone-800">Step 4: Packaging</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Primary packaging specs, manufacturer details, COA, and URS documents
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
          Add Packaging
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="bg-stone-100/70 text-stone-700 font-bold border-b border-stone-200">
            <tr>
              <th className="px-4 py-3 min-w-[200px]">Packaging Name</th>
              <th className="px-4 py-3 min-w-[170px]">Manufacturer</th>
              <th className="px-4 py-3 min-w-[210px]">COA Attachment</th>
              <th className="px-4 py-3 min-w-[210px]">URS Attachment</th>
              <th className="px-4 py-3 w-36 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Input Row */}
            {isAdding && (
              <tr className="bg-blue-50/40 border-b-2 border-blue-200 align-top">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="e.g. Type I Glass Vial 10ml..."
                    value={newRow.packaagingName}
                    onChange={(e) => setNewRow({ ...newRow, packaagingName: e.target.value })}
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Manufacturer / Supplier..."
                    value={newRow.manufactor}
                    onChange={(e) => setNewRow({ ...newRow, manufactor: e.target.value })}
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) => setNewRow({ ...newRow, coaFile: e.target.files?.[0] || null })}
                    className="block w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                  />
                  {newRow.coaFile && (
                    <p className="mt-1 text-[11px] text-stone-500 truncate max-w-[190px]">
                      Selected: {newRow.coaFile.name}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) => setNewRow({ ...newRow, ursFile: e.target.files?.[0] || null })}
                    className="block w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                  />
                  {newRow.ursFile && (
                    <p className="mt-1 text-[11px] text-stone-500 truncate max-w-[190px]">
                      Selected: {newRow.ursFile.name}
                    </p>
                  )}
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
                      onClick={resetNewRow}
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

            {/* Loading & Empty States */}
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  Loading packaging records...
                </td>
              </tr>
            ) : list.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  No packaging materials recorded for this project yet.
                </td>
              </tr>
            ) : (
              list.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30 align-top">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.packaagingName}
                          onChange={(e) => setEditForm({ ...editForm, packaagingName: e.target.value })}
                          className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.manufactor}
                          onChange={(e) => setEditForm({ ...editForm, manufactor: e.target.value })}
                          className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {editForm.currentCoa && (
                          <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[200px]">
                            Current: <span className="font-medium text-stone-700">{getFileName(editForm.currentCoa)}</span>
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) => setEditForm({ ...editForm, coaFile: e.target.files?.[0] || null })}
                          className="block w-full text-xs text-stone-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-800 hover:file:bg-blue-200 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {editForm.currentUrs && (
                          <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[200px]">
                            Current: <span className="font-medium text-stone-700">{getFileName(editForm.currentUrs)}</span>
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) => setEditForm({ ...editForm, ursFile: e.target.files?.[0] || null })}
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
                            onClick={handleCancelEdit}
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
                    <td className="px-4 py-3 font-semibold text-stone-800">
                      {item.packaagingName || "-"}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {item.manufactor || <span className="text-stone-400 italic">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {item.coa ? (
                        <a
                          href={getFileUrl(item.coa)}
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
                          <span className="truncate max-w-[150px]">{getFileName(item.coa, "COA File")}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-stone-400 italic">No COA</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {item.urs ? (
                        <a
                          href={getFileUrl(item.urs)}
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
                          <span className="truncate max-w-[150px]">{getFileName(item.urs, "URS File")}</span>
                        </a>
                      ) : (
                        <span className="text-xs text-stone-400 italic">No URS</span>
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
