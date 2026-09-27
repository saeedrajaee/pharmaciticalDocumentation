"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createFurmolationDevelopAction,
  deleteFurmolationDevelopAction,
  getFurmolationDevelopListAction,
  updateFurmolationDevelopAction,
} from "@/app/actions/formulation-development-action";

const isActionError = (res) => res?.error === true || res?.success === false;

const getActionMessage = (res, fallback) => {
  if (res?.message) return res.message;
  if (res?.details) {
    const firstErr = Object.values(res.details)?.[0]?.[0];
    if (firstErr) return firstErr;
  }
  return fallback;
};

export default function Step7FormulationDevelopment({ projectId }) {
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Add state
  const [isAdding, setIsAdding] = useState(false);
  const [newFurmol, setNewFurmol] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newManufacturingMethod, setNewManufacturingMethod] = useState("");
  const [newPackaging, setNewPackaging] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [editFurmol, setEditFurmol] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editManufacturingMethod, setEditManufacturingMethod] = useState("");
  const [editPackaging, setEditPackaging] = useState("");

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
      const res = await getFurmolationDevelopListAction(Number(projectId));
      const records = Array.isArray(res) ? res : res?.data;

      if (Array.isArray(records)) {
        setList(records);
      } else if (isActionError(res)) {
        console.error(
          "Error loading Step 7 records:",
          getActionMessage(res, "Unknown error")
        );
        setList([]);
      } else {
        setList([]);
      }
    } catch (err) {
      console.error("Error loading Step 7 records:", err);
      setList([]);
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
    setNewFurmol("");
    setNewDate("");
    setNewManufacturingMethod("");
    setNewPackaging("");
    setIsAdding(false);
  };

  const handleSaveNew = () => {
    startTransition(async () => {
      try {
        const payload = {
          furmol: newFurmol || undefined,
          date: newDate || undefined,
          manufacturingMethod: newManufacturingMethod || undefined,
          packaging: newPackaging || undefined,
        };

        const res = await createFurmolationDevelopAction(
          Number(projectId),
          payload
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to create Step 7 record."));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating Step 7 record:", err);
        alert("An error occurred while saving the record.");
      }
    });
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditFurmol(item?.furmol ?? "");
    setEditDate(item?.date ? String(item.date).slice(0, 10) : "");
    setEditManufacturingMethod(item?.manufacturingMethod ?? "");
    setEditPackaging(item?.packaging ?? "");
  };

  const handleSaveEdit = (id) => {
    startTransition(async () => {
      try {
        const payload = {
          furmol: editFurmol || undefined,
          date: editDate || undefined,
          manufacturingMethod: editManufacturingMethod || undefined,
          packaging: editPackaging || undefined,
        };

        const res = await updateFurmolationDevelopAction(
          Number(projectId),
          Number(id),
          payload
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to update record."));
          return;
        }

        setEditingId(null);
        await loadData();
      } catch (err) {
        console.error("Error updating Step 7 record:", err);
        alert("An error occurred while updating the record.");
      }
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;

    startTransition(async () => {
      try {
        const res = await deleteFurmolationDevelopAction(
          Number(projectId),
          Number(id)
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to delete record."));
          return;
        }

        await loadData();
      } catch (err) {
        console.error("Error deleting Step 7 record:", err);
        alert("An error occurred while deleting the record.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading Formulation Development module...
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
            Step 7: Formulation Development
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Manage formulation records, dates, manufacturing methods, and packaging specifications
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
          Add Record
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[160px] px-4 py-3">Formulation</th>
              <th className="min-w-[150px] px-4 py-3">Date</th>
              <th className="min-w-[220px] px-4 py-3">Manufacturing Method</th>
              <th className="min-w-[180px] px-4 py-3">Packaging</th>
              <th className="w-32 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Row Input */}
            {isAdding && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                <td className="px-4 py-3">
                  <input
                    value={newFurmol}
                    onChange={(e) => setNewFurmol(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Enter formulation"
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    value={newManufacturingMethod}
                    onChange={(e) => setNewManufacturingMethod(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Enter manufacturing method"
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    value={newPackaging}
                    onChange={(e) => setNewPackaging(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Enter packaging details"
                  />
                </td>

                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
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
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
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
                    Loading records...
                  </div>
                </td>
              </tr>
            ) : list.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  No formulation development records found for this project.
                </td>
              </tr>
            ) : (
              list.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30">
                      <td className="px-4 py-3">
                        <input
                          value={editFurmol}
                          onChange={(e) => setEditFurmol(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                          placeholder="Formulation"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={editManufacturingMethod}
                          onChange={(e) => setEditManufacturingMethod(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                          placeholder="Manufacturing Method"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          value={editPackaging}
                          onChange={(e) => setEditPackaging(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                          placeholder="Packaging"
                        />
                      </td>

                      <td className="px-4 py-3 text-center">
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
                            onClick={() => setEditingId(null)}
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
                      {item?.furmol || <span className="italic text-stone-400">-</span>}
                    </td>

                    <td className="px-4 py-3 text-stone-600">
                      {item?.date ? (
                        String(item.date).slice(0, 10)
                      ) : (
                        <span className="italic text-stone-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-stone-600">
                      {item?.manufacturingMethod || (
                        <span className="italic text-stone-400">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-stone-600">
                      {item?.packaging || (
                        <span className="italic text-stone-400">-</span>
                      )}
                    </td>

                    {/* Action buttons */}
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStartEdit(item)}
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95 disabled:opacity-50"
                          title="Edit"
                          aria-label="Edit record"
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
                          aria-label="Delete record"
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
