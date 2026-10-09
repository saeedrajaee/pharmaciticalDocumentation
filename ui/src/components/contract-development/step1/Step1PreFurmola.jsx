"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createPreFormulationAction,
  deletePreFormulationAction,
  getPreFormulationsAction,
  updatePreFormulationAction,
} from "@/app/actions/pre-furmola-action";

const isActionError = (res) => {
  return res?.error === true || res?.success === false;
};

const getActionMessage = (res, fallback) =>
  res?.message || (typeof res?.error === "string" ? res.error : fallback);

export default function Step4PreFormulationComponent({
  projectId,
  onDataStatusChange,
}) {
  const [mounted, setMounted] = useState(false);
  const [formulaList, setFormulaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // State for adding a new main formulation row
  const [isAdding, setIsAdding] = useState(false);
  const [newFormul, setNewFormul] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // State for inline editing of main formulation row
  const [editingId, setEditingId] = useState(null);
  const [editFormul, setEditFormul] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // State for Parts Modal
  const [activeItemForParts, setActiveItemForParts] = useState(null);
  const [currentParts, setCurrentParts] = useState([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // پایش و ارسال وضعیت وجود داده به کامپوننت والد
  useEffect(() => {
    if (mounted && !loading) {
      onDataStatusChange?.(formulaList.length > 0);
    }
  }, [formulaList, mounted, loading, onDataStatusChange]);

  const loadData = async () => {
    if (!projectId) {
      setFormulaList([]);
      setLoading(false);
      onDataStatusChange?.(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getPreFormulationsAction(projectId);
      const records = Array.isArray(res) ? res : res?.data;

      if (Array.isArray(records)) {
        setFormulaList(records);
      } else {
        setFormulaList([]);
      }
    } catch (err) {
      console.error("Error loading Pre-Formulation records:", err);
      setFormulaList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, mounted]);

  // Reset add new row form
  const resetNewRow = () => {
    setNewFormul("");
    setNewDescription("");
    setIsAdding(false);
  };

  // Save new formulation
  const handleSaveNew = () => {
    if (!newFormul.trim()) {
      alert("Please enter the formula name or code.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          formul: newFormul.trim(),
          description: newDescription.trim() || undefined,
          parts: [],
        };

        const res = await createPreFormulationAction(projectId, payload);

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to create formulation record."));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating formula record:", err);
        alert("An error occurred while creating the formulation.");
      }
    });
  };

  // Start inline editing
  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditFormul(item.formul || "");
    setEditDescription(item.description || "");
  };

  // Save inline edit
  const handleSaveEdit = (id) => {
    if (!editFormul.trim()) {
      alert("Formula name/code cannot be empty.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          formul: editFormul.trim(),
          description: editDescription.trim() || undefined,
        };

        const res = await updatePreFormulationAction(projectId, id, payload);

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to update formulation."));
          return;
        }

        setEditingId(null);
        await loadData();
      } catch (err) {
        console.error("Error updating formula record:", err);
        alert("An error occurred while updating the formulation.");
      }
    });
  };

  // Delete formulation record
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this formulation and all its parts?")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deletePreFormulationAction(projectId, id);

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to delete formulation."));
          return;
        }

        await loadData();
      } catch (err) {
        console.error("Error deleting formula record:", err);
        alert("An error occurred while deleting the formulation.");
      }
    });
  };

  // Open Parts Modal
  const handleOpenPartsModal = (item) => {
    setActiveItemForParts(item);
    const existingParts = item.step4PreFormulationParts || [];
    setCurrentParts(
      existingParts.map((p) => ({
        componentsName: p.componentsName || "",
        componentsAmount:
          p.componentsAmount !== null && p.componentsAmount !== undefined
            ? p.componentsAmount
            : "",
        componentsRole: p.componentsRole || "",
        manufacturingProcess: p.manufacturingProcess || "",
      }))
    );
  };

  // Add new part row inside modal
  const handleAddPartRow = () => {
    setCurrentParts((prev) => [
      ...prev,
      {
        componentsName: "",
        componentsAmount: "",
        componentsRole: "",
        manufacturingProcess: "",
      },
    ]);
  };

  // Handle changes to part fields
  const handlePartFieldChange = (index, field, value) => {
    setCurrentParts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Remove a part row
  const handleRemovePartRow = (index) => {
    setCurrentParts((prev) => prev.filter((_, i) => i !== index));
  };

  // Save parts modal
  const handleSavePartsModal = () => {
    if (!activeItemForParts) return;

    const formattedParts = currentParts.map((part) => ({
      componentsName: part.componentsName?.trim() || undefined,
      componentsAmount:
        part.componentsAmount !== "" && !isNaN(Number(part.componentsAmount))
          ? Number(part.componentsAmount)
          : undefined,
      componentsRole: part.componentsRole?.trim() || undefined,
      manufacturingProcess: part.manufacturingProcess?.trim() || undefined,
    }));

    startTransition(async () => {
      try {
        const payload = {
          parts: formattedParts,
        };

        const res = await updatePreFormulationAction(
          projectId,
          activeItemForParts.id,
          payload
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to update formulation parts."));
          return;
        }

        setActiveItemForParts(null);
        setCurrentParts([]);
        await loadData();
      } catch (err) {
        console.error("Error saving parts:", err);
        alert("An error occurred while saving formulation parts.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading Pre-Formulation Module...
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      dir="ltr"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/80 px-4 py-3.5 backdrop-blur-sm">
        <div>
          <h3 className="text-sm font-bold text-stone-800">
            Step 4: Pre-Formulation Data Entry
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Manage proposed formulations, active components, excipients, and manufacturing processes.
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
          Add New Formulation
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[180px] px-4 py-3">Formula</th>
              <th className="min-w-[220px] px-4 py-3">Description</th>
              <th className="w-32 px-4 py-3 text-center">Components / Parts</th>
              <th className="min-w-[130px] px-4 py-3">Created At</th>
              <th className="w-32 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Formulation Input Row */}
            {isAdding && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                <td className="px-4 py-2.5">
                  <input
                    type="text"
                    placeholder="Formula Name (Required)"
                    value={newFormul}
                    onChange={(e) => setNewFormul(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="text"
                    placeholder="Optional description..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-2.5 text-center text-xs italic text-stone-400">
                  Available after save
                </td>
                <td className="px-4 py-2.5 text-xs text-stone-400">-</td>
                <td className="px-4 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveNew}
                      className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={resetNewRow}
                      className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
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
                      className="h-4 w-4 animate-spin text-blue-600"
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
                    Loading pre-formulation data...
                  </div>
                </td>
              </tr>
            ) : formulaList.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-stone-400">
                  No pre-formulation records found for this project.
                </td>
              </tr>
            ) : (
              formulaList.map((item) => {
                const isEditing = editingId === item.id;
                const partsCount = item.step4PreFormulationParts?.length || 0;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30">
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={editFormul}
                          onChange={(e) => setEditFormul(e.target.value)}
                          className="w-full rounded-lg border border-stone-300 px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full rounded-lg border border-stone-300 px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-stone-400">
                        {partsCount} parts
                      </td>
                      <td className="px-4 py-2.5 text-xs text-stone-400">
                        {item.createdAt
                          ? new Date(item.createdAt).toLocaleDateString("en-US")
                          : "-"}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveEdit(item.id)}
                            className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-stone-300 bg-white px-2.5 py-1 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
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
                      {item.formul}
                    </td>

                    <td className="px-4 py-3 text-stone-600">
                      {item.description || (
                        <span className="italic text-stone-300">No description</span>
                      )}
                    </td>

                    {/* Parts Trigger Button */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleOpenPartsModal(item)}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all ${
                          partsCount > 0
                            ? "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                            : "border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100"
                        }`}
                        title="View and edit formulation parts"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                        <span>
                          {partsCount > 0 ? `${partsCount} Parts` : "Add Parts"}
                        </span>
                      </button>
                    </td>

                    <td className="px-4 py-3 text-xs text-stone-500">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-US")
                        : "-"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {/* Edit Row Button */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStartEdit(item)}
                          className="rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 disabled:opacity-50"
                          title="Edit formula"
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

                        {/* Delete Row Button */}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-rose-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                          title="Delete formula"
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

      {/* ========================================================= */}
      {/* Parts Modal (Formulation Details) */}
      {/* ========================================================= */}
      {activeItemForParts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          dir="ltr"
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50 px-5 py-3.5">
              <div>
                <h4 className="text-sm font-bold text-stone-800">
                  Formulation Details:{" "}
                  <span className="text-blue-600">
                    {activeItemForParts.formul}
                  </span>
                </h4>
                <p className="text-xs text-stone-500">
                  Manage components, quantitative composition, functions, and processing details.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveItemForParts(null)}
                className="rounded-lg p-1.5 text-stone-400 hover:bg-stone-200 hover:text-stone-700"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Body & Table */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">
                  Components List ({currentParts.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddPartRow}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Component Row
                </button>
              </div>

              {currentParts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-stone-200 p-8 text-center text-xs text-stone-400">
                  No components added yet. Click &quot;Add Component Row&quot; to begin.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-stone-200">
                  <table className="min-w-full text-left text-xs">
                    <thead className="bg-stone-100/80 font-bold text-stone-700">
                      <tr>
                        <th className="px-3 py-2.5">Component Name</th>
                        <th className="w-32 px-3 py-2.5">Amount (mg / mL / %)</th>
                        <th className="px-3 py-2.5">Function / Role</th>
                        <th className="px-3 py-2.5">Manufacturing Process</th>
                        <th className="w-16 px-3 py-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {currentParts.map((part, idx) => (
                        <tr key={idx} className="hover:bg-stone-50/50">
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="e.g. Sodium Chloride"
                              value={part.componentsName}
                              onChange={(e) =>
                                handlePartFieldChange(
                                  idx,
                                  "componentsName",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-md border border-stone-200 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              step="any"
                              placeholder="0.0"
                              value={part.componentsAmount}
                              onChange={(e) =>
                                handlePartFieldChange(
                                  idx,
                                  "componentsAmount",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-md border border-stone-200 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="e.g. Tonicity agent / Buffer"
                              value={part.componentsRole}
                              onChange={(e) =>
                                handlePartFieldChange(
                                  idx,
                                  "componentsRole",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-md border border-stone-200 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              placeholder="Dissolution / Mixing instructions"
                              value={part.manufacturingProcess}
                              onChange={(e) =>
                                handlePartFieldChange(
                                  idx,
                                  "manufacturingProcess",
                                  e.target.value
                                )
                              }
                              className="w-full rounded-md border border-stone-200 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemovePartRow(idx)}
                              className="rounded p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700"
                              title="Delete row"
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
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setActiveItemForParts(null)}
                className="rounded-lg border border-stone-300 bg-white px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={handleSavePartsModal}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
