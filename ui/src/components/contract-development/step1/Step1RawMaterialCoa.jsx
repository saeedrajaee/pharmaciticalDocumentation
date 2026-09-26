"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  getRawMaterialCoaListAction,
  createRawMaterialCoaAction,
  deleteRawMaterialCoaAction,
  updateRawMaterialCoaAction,
} from "@/app/actions/raw-material-coa-action";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

const getFileUrl = (path) => {
  if (!path) return "#";
  if (path.startsWith("http")) return path;

  const cleanPath = String(path).replace(/\\/g, "/");
  return `${BACKEND_URL}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;
};

const emptyRow = {
  materialName: "",
  manufacturer: "",
  pharmaCopia: "",
  chekedByQC: "true",
  pharmaCopiaFile: null,
  coaFile: null,
};

export default function Step3RawMaterialCoaSection({ projectId }) {
  const [mounted, setMounted] = useState(false);
  const [coaList, setCoaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // ردیف جدید در حال افزودن
  const [isAdding, setIsAdding] = useState(false);
  const [newRow, setNewRow] = useState({ ...emptyRow });

  // وضعیت ردیف در حال ویرایش
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!projectId) return;

    setLoading(true);
    try {
      const data = await getRawMaterialCoaListAction(projectId);
      if (Array.isArray(data)) {
        setCoaList(data);
      }
    } catch (err) {
      console.error("Error loading raw material COA records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && mounted) {
      loadData();
    }
  }, [projectId, mounted]);

  const appendFiles = (formData, form) => {
    if (form.pharmaCopiaFile) {
      formData.append("pharmaCopiaFile", form.pharmaCopiaFile);
    }

    if (form.coaFile) {
      formData.append("coaFile", form.coaFile);
    }
  };

  const handleSaveNew = () => {
    if (!newRow.materialName.trim() || !newRow.manufacturer.trim()) {
      alert("لطفاً نام ماده و نام تولیدکننده را وارد نمایید.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("materialName", newRow.materialName.trim());
      formData.append("manufacturer", newRow.manufacturer.trim());
      formData.append("chekedByQC", newRow.chekedByQC);

      if (newRow.pharmaCopia.trim()) {
        formData.append("pharmaCopia", newRow.pharmaCopia.trim());
      }

      appendFiles(formData, newRow);

      const res = await createRawMaterialCoaAction(projectId, formData);

      if (res?.error) {
        alert(res.message || "خطا در ثبت رکورد COA.");
      } else {
        setIsAdding(false);
        setNewRow({ ...emptyRow });
        await loadData();
      }
    });
  };

  const handleStartEdit = (coa) => {
    setEditingId(coa.id);
    setEditForm({
      materialName: coa.materialName || "",
      manufacturer: coa.manufacturer || "",
      pharmaCopia: coa.pharmaCopia || "",
      chekedByQC:
        coa.chekedByQC !== undefined ? String(coa.chekedByQC) : "false",
      pharmaCopiaFile: null,
      coaFile: null,
    });
  };

  const handleSaveEdit = (coaId) => {
    if (!editForm.materialName?.trim() || !editForm.manufacturer?.trim()) {
      alert("لطفاً نام ماده و نام تولیدکننده را وارد نمایید.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("materialName", editForm.materialName.trim());
      formData.append("manufacturer", editForm.manufacturer.trim());
      formData.append("chekedByQC", editForm.chekedByQC);

      if (editForm.pharmaCopia?.trim()) {
        formData.append("pharmaCopia", editForm.pharmaCopia.trim());
      }

      appendFiles(formData, editForm);

      const res = await updateRawMaterialCoaAction(
        projectId,
        coaId,
        formData,
      );

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
      const res = await deleteRawMaterialCoaAction(projectId, coaId);

      if (res?.error) {
        alert(res.message || "خطا در حذف رکورد COA.");
      } else {
        await loadData();
      }
    });
  };

  const renderBadge = (isChecked) => {
    const checked = isChecked === true || isChecked === "true";

    return checked ? (
      <span className="inline-flex items-center rounded-full border border-emerald-300 bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        Yes
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full border border-rose-300 bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
        No
      </span>
    );
  };

  const renderFileLink = (path, label) => {
    return path ? (
      <a
        href={getFileUrl(path)}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100 hover:text-blue-800"
      >
        <span>{label}</span>
      </a>
    ) : (
      <span className="text-xs italic text-stone-400">No attachment</span>
    );
  };

  const renderFileInputs = (form, setForm) => (
    <>
      <div className="space-y-1">
        <label className="block text-xs font-medium text-stone-600">
          Pharmacopoeia File
        </label>
        <input
          type="file"
          onChange={(e) =>
            setForm({
              ...form,
              pharmaCopiaFile: e.target.files?.[0] || null,
            })
          }
          className="block w-full text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
        />
      </div>

      <div className="space-y-1">
        <label className="block text-xs font-medium text-stone-600">
          COA File
        </label>
        <input
          type="file"
          onChange={(e) =>
            setForm({
              ...form,
              coaFile: e.target.files?.[0] || null,
            })
          }
          className="block w-full text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
        />
      </div>
    </>
  );

  // جلوگیری از Hydration mismatch تا زمان مانت کامل کلاینت
  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading raw material COA module...
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
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 bg-stone-50/80 px-4 py-3.5">
        <div>
          <h3 className="text-sm font-bold text-stone-800">
            Step 3: Raw Material
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Raw Material COA, Pharmacopoeia, Manufacturer, and QC Review
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
          Add New
        </button>
      </div>

      {/* COA Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[180px] px-4 py-3">Material Name</th>
              <th className="min-w-[160px] px-4 py-3">Manufacturer</th>
              <th className="min-w-[130px] px-4 py-3">Pharmacopoeia</th>
              <th className="min-w-[160px] px-4 py-3">Pharmacopoeia File</th>
              <th className="min-w-[130px] px-4 py-3">COA File</th>
              <th className="w-36 px-4 py-3">Checked by QC</th>
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
                    placeholder="e.g. Paracetamol, Lactose..."
                    value={newRow.materialName}
                    onChange={(e) =>
                      setNewRow({ ...newRow, materialName: e.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>

                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Manufacturer name..."
                    value={newRow.manufacturer}
                    onChange={(e) =>
                      setNewRow({ ...newRow, manufacturer: e.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2.5 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>

                <td className="px-4 py-3">
                  <select
                    value={newRow.pharmaCopia}
                    onChange={(e) =>
                      setNewRow({ ...newRow, pharmaCopia: e.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select</option>
                    <option value="USP">USP</option>
                    <option value="BP">BP</option>
                    <option value="EP">EP</option>
                    <option value="JP">JP</option>
                    <option value="NA">NA</option>
                  </select>
                </td>

                {/* Pharmacopoeia File */}
                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewRow({
                        ...newRow,
                        pharmaCopiaFile: e.target.files?.[0] || null,
                      })
                    }
                    className="block w-full text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
                  />
                </td>

                {/* COA File */}
                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) =>
                      setNewRow({
                        ...newRow,
                        coaFile: e.target.files?.[0] || null,
                      })
                    }
                    className="block w-full text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
                  />
                </td>

                {/* Checked by QC */}
                <td className="px-4 py-3">
                  <select
                    value={newRow.chekedByQC}
                    onChange={(e) =>
                      setNewRow({ ...newRow, chekedByQC: e.target.value })
                    }
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                  >
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </td>

                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={handleSaveNew}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => {
                        setIsAdding(false);
                        setNewRow({ ...emptyRow });
                      }}
                      className="rounded-lg border border-stone-300/60 bg-stone-500/10 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-all hover:bg-stone-500/20 active:scale-95 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Loading / Empty / Data */}
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-stone-400"
                >
                  Loading COA records...
                </td>
              </tr>
            ) : coaList.length === 0 && !isAdding ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-stone-400"
                >
                  No raw material COA records found for this project yet.
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
                          value={editForm.materialName}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              materialName: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editForm.manufacturer}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              manufacturer: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>

                      <td className="px-4 py-3">
                        <select
                          value={editForm.pharmaCopia}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              pharmaCopia: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">Select</option>
                          <option value="USP">USP</option>
                          <option value="BP">BP</option>
                          <option value="EP">EP</option>
                          <option value="JP">JP</option>
                          <option value="NA">NA</option>
                        </select>
                      </td>

                      {/* Pharmacopoeia File */}
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {renderFileLink(
                            item.pharmaCopiaFileUrl,
                            "View Pharmacopoeia",
                          )}
                          <input
                            type="file"
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                pharmaCopiaFile: e.target.files?.[0] || null,
                              })
                            }
                            className="block w-full text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
                          />
                        </div>
                      </td>

                      {/* COA File */}
                      <td className="px-4 py-3">
                        <div className="space-y-2">
                          {renderFileLink(item.coaFileUrl, "View COA")}
                          <input
                            type="file"
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                coaFile: e.target.files?.[0] || null,
                              })
                            }
                            className="block w-full text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2.5 file:py-1 file:text-xs file:font-semibold file:text-blue-800 hover:file:bg-blue-200"
                          />
                        </div>
                      </td>

                      {/* Checked by QC */}
                      <td className="px-4 py-3">
                        <select
                          value={editForm.chekedByQC}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              chekedByQC: e.target.value,
                            })
                          }
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        >
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveEdit(item.id)}
                            className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition-all hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50"
                          >
                            Save
                          </button>

                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-stone-300/60 bg-stone-500/10 px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition-all hover:bg-stone-500/20 active:scale-95 disabled:opacity-50"
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
                      {item.materialName}
                    </td>

                    <td className="px-4 py-3 font-medium text-stone-600">
                      {item.manufacturer}
                    </td>

                    <td className="px-4 py-3">
                      {item.pharmaCopia || "-"}
                    </td>

                    <td className="px-4 py-3">
                      {renderFileLink(
                        item.pharmaCopiaFileUrl,
                        "View Pharmacopoeia",
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {renderFileLink(item.coaFileUrl, "View COA")}
                    </td>

                    <td className="px-4 py-3">
                      {renderBadge(item.chekedByQC)}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStartEdit(item)}
                          className="rounded-lg p-1.5 text-emerald-600 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
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
                          className="rounded-lg p-1.5 text-rose-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
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
