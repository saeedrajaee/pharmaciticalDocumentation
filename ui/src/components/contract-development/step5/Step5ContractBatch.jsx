"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createContractBatchAction,
  deleteContractBatchAction,
  getContractBatchesByProjectIdAction,
  updateContractBatchAction,
} from "@/app/actions/contract-batch-actions";
import {
  getContractResultsAction,
  deleteContractResultAction,
} from "@/app/actions/contract-result-actions";
import { getContractSpecificationByProjectIdAction } from "@/app/actions/contract-specification-actions";

import Step5ContractResultModal from "./Step5ContractResultModal";
import Step5ResultDetailsModal from "./Step5ResultDetailsModal";

const isActionError = (res) => res?.error === true || res?.success === false;

const getActionMessage = (res, fallback) => {
  if (res?.message) return res.message;
  if (res?.details) {
    const firstErr = Object.values(res.details)?.[0]?.[0];
    if (firstErr) return firstErr;
  }
  return fallback;
};

function normalizeDateForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

export default function Step5ContractBatch({ projectId, onDataStatusChange }) {
  const [mounted, setMounted] = useState(false);
  const [list, setList] = useState([]);
  const [specification, setSpecification] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Results & Expansion State
  const [expandedBatches, setExpandedBatches] = useState({});
  const [batchResults, setBatchResults] = useState({});
  const [loadingResults, setLoadingResults] = useState({});

  // Modals State
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [activeBatch, setActiveBatch] = useState(null);
  const [activeResult, setActiveResult] = useState(null);
  const [editingResult, setEditingResult] = useState(null);

  // Add Row State (Batch)
  const [isAdding, setIsAdding] = useState(false);
  const [newBatchNumber, setNewBatchNumber] = useState("");
  const [newBatchDate, setNewBatchDate] = useState("");
  const [newDescription, setNewDescription] = useState("");

  // Edit Row State (Batch)
  const [editingId, setEditingId] = useState(null);
  const [editBatchNumber, setEditBatchNumber] = useState("");
  const [editBatchDate, setEditBatchDate] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // گزارش وضعیت پر بودن/خالی بودن داده‌ها به کامپوننت والد
  useEffect(() => {
    if (mounted && !loading) {
      onDataStatusChange?.(list.length > 0);
    }
  }, [list, mounted, loading, onDataStatusChange]);

  const loadData = async () => {
    if (!projectId) {
      setList([]);
      setSpecification(null);
      setLoading(false);
      onDataStatusChange?.(false);
      return;
    }

    setLoading(true);
    try {
      const [batchRes, specRes] = await Promise.all([
        getContractBatchesByProjectIdAction(Number(projectId)),
        getContractSpecificationByProjectIdAction(Number(projectId)),
      ]);

      const records = Array.isArray(batchRes)
        ? batchRes
        : batchRes?.data || batchRes?.batches;

      if (Array.isArray(records)) {
        setList(records);

        // پر کردن کش اولیه نتایج در صورتی که همراه با بچ برگردانده شده باشند
        const initialResultsMap = {};
        records.forEach((b) => {
          if (Array.isArray(b.results) || Array.isArray(b.contractResults)) {
            initialResultsMap[b.id] = b.results || b.contractResults;
          }
        });
        if (Object.keys(initialResultsMap).length > 0) {
          setBatchResults((prev) => ({ ...prev, ...initialResultsMap }));
        }
      } else {
        setList([]);
      }

      const specData = Array.isArray(specRes)
        ? specRes[0]
        : specRes?.data?.[0] || specRes;
      setSpecification(specData || null);
    } catch (err) {
      console.error("Error loading contract batches/specifications:", err);
      setList([]);
      setSpecification(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [projectId, mounted]);

  const fetchResultsForBatch = async (batchId) => {
    setLoadingResults((prev) => ({ ...prev, [batchId]: true }));
    try {
      const results = await getContractResultsAction(Number(batchId));
      setBatchResults((prev) => ({
        ...prev,
        [batchId]: Array.isArray(results) ? results : results?.data || [],
      }));
    } catch (err) {
      console.error(`Error loading results for batch ${batchId}:`, err);
      setBatchResults((prev) => ({ ...prev, [batchId]: [] }));
    } finally {
      setLoadingResults((prev) => ({ ...prev, [batchId]: false }));
    }
  };

  const toggleExpand = async (batchId) => {
    const nextState = !expandedBatches[batchId];
    setExpandedBatches((prev) => ({ ...prev, [batchId]: nextState }));

    if (nextState) {
      await fetchResultsForBatch(batchId);
    }
  };

  const openAddResultModal = (item, e) => {
    if (e) e.stopPropagation();
    setActiveBatch(item);
    setEditingResult(null);
    setIsResultModalOpen(true);
  };

  const openViewDetails = (resItem, e) => {
    if (e) e.stopPropagation();
    setActiveResult(resItem);
    setIsDetailsModalOpen(true);
  };

  const handleResultSuccess = () => {
    if (activeBatch?.id) {
      fetchResultsForBatch(activeBatch.id);
      setExpandedBatches((prev) => ({ ...prev, [activeBatch.id]: true }));
    }
    setIsResultModalOpen(false);
    setActiveBatch(null);
    setEditingResult(null);
  };

  const handleDeleteResult = async (batchId, resultId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this stability result?")) return;

    startTransition(async () => {
      const res = await deleteContractResultAction(resultId);
      if (res?.error) {
        alert(res.message || "Failed to delete result");
        return;
      }
      fetchResultsForBatch(batchId);
    });
  };

  const resetNewRow = () => {
    setNewBatchNumber("");
    setNewBatchDate("");
    setNewDescription("");
    setIsAdding(false);
  };

  const handleSaveNew = (e) => {
    if (e) e.stopPropagation();
    if (!newBatchNumber.trim() || !newBatchDate) {
      alert("Batch Number and Manufacturing Date are required.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          batchNumber: newBatchNumber.trim(),
          batchDate: newBatchDate,
          description: newDescription.trim() || undefined,
        };

        const res = await createContractBatchAction(Number(projectId), payload);

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to create batch"));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating batch:", err);
      }
    });
  };

  const handleSaveEdit = (id, e) => {
    if (e) e.stopPropagation();
    if (!editBatchNumber.trim() || !editBatchDate) {
      alert("Batch Number and Manufacturing Date are required.");
      return;
    }

    startTransition(async () => {
      try {
        const payload = {
          batchNumber: editBatchNumber.trim(),
          batchDate: editBatchDate,
          description: editDescription.trim() || undefined,
        };

        const res = await updateContractBatchAction(
          Number(projectId),
          Number(id),
          payload
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "Failed to update batch"));
          return;
        }

        setEditingId(null);
        await loadData();
      } catch (err) {
        console.error("Error updating batch:", err);
      }
    });
  };

  const handleDeleteBatch = (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this batch?")) return;

    startTransition(async () => {
      const res = await deleteContractBatchAction(Number(projectId), Number(id));
      if (isActionError(res)) {
        alert(getActionMessage(res, "Failed to delete batch"));
        return;
      }
      await loadData();
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading Stability Batches module...
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      dir="ltr"
      suppressHydrationWarning
    >
      {/* Header Container */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/80 px-4 py-3.5">
        <div>
          <h3 className="text-sm font-bold text-stone-800">
            Stability Study Batches
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Manage batch numbers, manufacturing dates, and stability analytical results
          </p>
        </div>

        <button
          type="button"
          disabled={isAdding || isPending || !projectId}
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Batch
        </button>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="w-10 px-3 py-3 text-center"></th>
              <th className="min-w-[170px] px-4 py-3">Batch Number *</th>
              <th className="min-w-[150px] px-4 py-3">Mfg. Date *</th>
              <th className="min-w-[220px] px-4 py-3">Description</th>
              <th className="w-48 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Row Input */}
            {isAdding && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                <td className="px-3 py-3"></td>
                <td className="px-4 py-3">
                  <input
                    value={newBatchNumber}
                    onChange={(e) => setNewBatchNumber(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="e.g. BATCH-001"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="date"
                    value={newBatchDate}
                    onChange={(e) => setNewBatchDate(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                    placeholder="Optional remarks"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveNew}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={resetNewRow}
                      className="rounded-lg border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-200 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Loading / Empty States */}
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
                    Loading batches...
                  </div>
                </td>
              </tr>
            ) : list.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-xs text-stone-400">
                  No stability study batches found for this project.
                </td>
              </tr>
            ) : (
              list.map((item) => {
                const isEditing = editingId === item.id;
                const isExpanded = !!expandedBatches[item.id];
                const results = batchResults[item.id] || item.results || item.contractResults || [];

                const hasResults = results.length > 0;
                const rowBgClass = hasResults
                  ? isExpanded
                    ? "bg-emerald-100/70 border-l-4 border-l-emerald-500"
                    : "bg-emerald-50/60 hover:bg-emerald-100/50"
                  : isExpanded
                  ? "bg-stone-100/80 border-l-4 border-l-blue-500"
                  : "hover:bg-stone-50/80";

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30">
                      <td className="px-3 py-3"></td>
                      <td className="px-4 py-3">
                        <input
                          value={editBatchNumber}
                          onChange={(e) => setEditBatchNumber(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          value={editBatchDate}
                          onChange={(e) => setEditBatchDate(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={(e) => handleSaveEdit(item.id, e)}
                            className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(null);
                            }}
                            className="rounded-lg border border-stone-300 bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700 transition hover:bg-stone-200 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }

                return (
                  <React.Fragment key={item.id}>
                    <tr
                      onClick={() => toggleExpand(item.id)}
                      className={`cursor-pointer transition-colors duration-150 select-none ${rowBgClass}`}
                    >
                      {/* Expansion Toggle */}
                      <td className="px-3 py-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(item.id);
                          }}
                          className="rounded p-1 text-stone-400 transition-colors hover:bg-stone-200/60 hover:text-stone-700"
                          title={isExpanded ? "Collapse Results" : "Expand Results"}
                        >
                          <svg
                            className={`h-4 w-4 transform transition-transform duration-200 ${
                              isExpanded ? "rotate-90 text-blue-600" : ""
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </td>

                      <td className="px-4 py-3 font-semibold text-stone-800">
                        <div className="flex items-center gap-2">
                          {item?.batchNumber || (
                            <span className="italic text-stone-400">-</span>
                          )}
                          {hasResults && (
                            <span
                              className="inline-block h-2 w-2 rounded-full bg-emerald-500"
                              title="Has stability results"
                            />
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-stone-600">
                        {item?.batchDate ? (
                          String(item.batchDate).slice(0, 10)
                        ) : (
                          <span className="italic text-stone-400">-</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-stone-600">
                        {item?.description || (
                          <span className="italic text-stone-400">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-2.5">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={(e) => openAddResultModal(item, e)}
                            className="group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-400/40 bg-blue-500/10 backdrop-blur-md shadow-xs transition-all duration-200 hover:scale-110 hover:border-blue-500/70 hover:bg-blue-500/25 active:scale-95 disabled:opacity-50"
                            title="Add Stability Result"
                            aria-label="Add Result"
                          >
                            <svg
                              className="h-5 w-5 text-blue-600 transition-colors group-hover:text-blue-700"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 4v16m8-8H4"
                              />
                            </svg>
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(item.id);
                              setEditBatchNumber(item?.batchNumber ?? "");
                              setEditBatchDate(normalizeDateForInput(item?.batchDate));
                              setEditDescription(item?.description ?? "");
                            }}
                            className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-100/60 hover:text-emerald-700 disabled:opacity-50"
                            title="Edit"
                            aria-label="Edit batch"
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
                            onClick={(e) => handleDeleteBatch(item.id, e)}
                            className="rounded-lg p-1.5 text-rose-600 transition hover:bg-rose-100/60 hover:text-rose-700 disabled:opacity-50"
                            title="Delete"
                            aria-label="Delete batch"
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

                    {/* Sub-table: Stability Results */}
                    {isExpanded && (
                      <tr className="bg-stone-50/70">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-2xs">
                            <div className="mb-3 flex items-center justify-between">
                              <span className="text-xs font-bold text-stone-700">
                                Stability Results for Batch:{" "}
                                <span className="font-mono font-semibold text-blue-700">
                                  {item.batchNumber}
                                </span>
                              </span>
                              <span className="text-[11px] text-stone-400">
                                {results.length} result(s) recorded
                              </span>
                            </div>

                            {loadingResults[item.id] ? (
                              <div className="py-4 text-center text-xs text-stone-400">
                                Loading results...
                              </div>
                            ) : results.length === 0 ? (
                              <div className="py-3 text-center text-xs italic text-stone-400">
                                No stability results added for this batch yet. Click the &quot;+&quot; button above to record one.
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-xs">
                                  <thead>
                                    <tr className="border-b border-stone-200 bg-stone-50 text-[11px] font-bold text-stone-500">
                                      <th className="px-3 py-2">Condition / Month</th>
                                      <th className="px-3 py-2">Assay (%)</th>
                                      <th className="px-3 py-2">pH</th>
                                      <th className="px-3 py-2">Uniformity (AV)</th>
                                      <th className="px-3 py-2">Sterility</th>
                                      <th className="w-20 px-3 py-2 text-center">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-stone-100 text-stone-700">
                                    {results.map((resItem) => (
                                      <tr key={resItem.id} className="hover:bg-stone-50/50">
                                        <td className="px-3 py-2 font-medium">
                                          {resItem.accelrator === "Accerator" || resItem.condition === "Accelerated"
                                            ? "Accelerated"
                                            : "Long-Term"}{" "}
                                          - Month {resItem.month || resItem.timepoint || resItem.time_point || "0"}
                                        </td>
                                        <td className="px-3 py-2 font-mono font-semibold text-stone-800">
                                          {resItem.assay ?? "-"}
                                        </td>
                                        <td className="px-3 py-2 font-mono">{resItem.pH ?? resItem.ph ?? "-"}</td>
                                        <td className="px-3 py-2 font-mono">{resItem.uniformityOfDosage ?? "-"}</td>
                                        <td className="px-3 py-2">
                                          {resItem.sterility ? (
                                            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                                              Pass
                                            </span>
                                          ) : (
                                            <span className="text-stone-400">-</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          <div className="flex items-center justify-center gap-1.5">
                                            <button
                                              type="button"
                                              onClick={(e) => openViewDetails(resItem, e)}
                                              className="rounded p-1 text-blue-600 transition hover:bg-blue-50 hover:text-blue-700"
                                              title="View & Compare Details"
                                              aria-label="View Details"
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
                                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth="2"
                                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                />
                                              </svg>
                                            </button>

                                            <button
                                              type="button"
                                              disabled={isPending}
                                              onClick={(e) => handleDeleteResult(item.id, resItem.id, e)}
                                              className="rounded p-1 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                                              title="Delete Result"
                                              aria-label="Delete result"
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
                                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                              </svg>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Contract Result Create / Edit Modal */}
      {isResultModalOpen && (
        <Step5ContractResultModal
          isOpen={isResultModalOpen}
          batch={activeBatch}
          initialData={editingResult}
          onClose={() => {
            setIsResultModalOpen(false);
            setActiveBatch(null);
            setEditingResult(null);
          }}
          onSuccess={handleResultSuccess}
        />
      )}

      {/* Contract Result View / Comparison Modal */}
      {isDetailsModalOpen && activeResult && (
        <Step5ResultDetailsModal
          result={activeResult}
          specification={specification}
          onClose={() => {
            setIsDetailsModalOpen(false);
            setActiveResult(null);
          }}
        />
      )}
    </div>
  );
}
