"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createAnalyticalDevlopRawAction,
  deleteAnalyticalDevlopRawAction,
  getAnalyticalDevlopRawListAction,
  updateAnalyticalDevlopRawAction,
} from "@/app/actions/analytical-devlop-raw-action";

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
  return cleanPath.split("/").pop() || "Download";
};

const isActionError = (res) => {
  return res?.error === true || res?.success === false;
};

const getActionMessage = (res, fallback) => {
  if (res?.message) return res.message;
  if (res?.details) {
    const firstErr = Object.values(res.details)?.[0]?.[0];
    if (firstErr) return firstErr;
  }
  return fallback;
};

export default function Step2AnalyticalDevlopRaw({
  projectId,
  onDataStatusChange,
}) {
  const [mounted, setMounted] = useState(false);
  const [rawList, setRawList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // State برای افزودن رکورد جدید
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newManufactor, setNewManufactor] = useState("");
  const [newSpecFile, setNewSpecFile] = useState(null);
  const [newMoaFile, setNewMoaFile] = useState(null);
  const [newDmfFile, setNewDmfFile] = useState(null);

  // State برای ویرایش رکورد موجود
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editManufactor, setEditManufactor] = useState("");
  const [editSpecFile, setEditSpecFile] = useState(null);
  const [editMoaFile, setEditMoaFile] = useState(null);
  const [editDmfFile, setEditDmfFile] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // گزارش وضعیت پر بودن دیتا به کامپوننت والد جهت فعال‌سازی تیک سبز
  useEffect(() => {
    if (rawList && rawList.length > 0) {
      onDataStatusChange?.(true);
    } else {
      onDataStatusChange?.(false);
    }
  }, [rawList, onDataStatusChange]);

  const loadData = async () => {
    if (!projectId) {
      setRawList([]);
      setLoading(false);
      onDataStatusChange?.(false);
      return;
    }

    setLoading(true);
    try {
      const res = await getAnalyticalDevlopRawListAction(projectId);
      const records = Array.isArray(res) ? res : res?.data;

      if (Array.isArray(records)) {
        setRawList(records);
      } else if (isActionError(res)) {
        console.error(
          "Error loading raw materials:",
          getActionMessage(res, "Unknown error")
        );
        setRawList([]);
      } else {
        setRawList([]);
      }
    } catch (err) {
      console.error("Error loading analytical dev raw records:", err);
      setRawList([]);
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
    setNewName("");
    setNewManufactor("");
    setNewSpecFile(null);
    setNewMoaFile(null);
    setNewDmfFile(null);
    setIsAdding(false);
  };

  const handleSaveNew = () => {
    if (!newName.trim()) {
      alert("لطفاً نام ماده اولیه را وارد نمایید.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", newName.trim());
        if (newManufactor.trim()) {
          formData.append("manufactor", newManufactor.trim());
        }
        if (newSpecFile) {
          formData.append("specFile", newSpecFile);
        }
        if (newMoaFile) {
          formData.append("moaFile", newMoaFile);
        }
        if (newDmfFile) {
          formData.append("dmfFile", newDmfFile);
        }

        const res = await createAnalyticalDevlopRawAction(
          Number(projectId),
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در ثبت ماده اولیه آنالیز."));
          return;
        }

        resetNewRow();
        await loadData();
      } catch (err) {
        console.error("Error creating analytical dev raw record:", err);
        alert("خطا در ثبت رکورد.");
      }
    });
  };

  const handleStartEdit = (item) => {
    setEditingId(item.id);
    setEditName(item.name || "");
    setEditManufactor(item.manufactor || "");
    setEditSpecFile(null);
    setEditMoaFile(null);
    setEditDmfFile(null);
  };

  const handleSaveEdit = (rawId) => {
    if (!editName.trim()) {
      alert("لطفاً نام ماده اولیه را وارد نمایید.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append("name", editName.trim());
        formData.append("manufactor", editManufactor.trim());

        if (editSpecFile) {
          formData.append("specFile", editSpecFile);
        }
        if (editMoaFile) {
          formData.append("moaFile", editMoaFile);
        }
        if (editDmfFile) {
          formData.append("dmfFile", editDmfFile);
        }

        const res = await updateAnalyticalDevlopRawAction(
          projectId,
          rawId,
          formData
        );

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در به‌روزرسانی ماده اولیه."));
          return;
        }

        setEditingId(null);
        await loadData();
      } catch (err) {
        console.error("Error updating record:", err);
        alert("خطا در به‌روزرسانی رکورد.");
      }
    });
  };

  const handleDelete = (rawId) => {
    if (!window.confirm("آیا از حذف این رکورد ماده اولیه اطمینان دارید؟")) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await deleteAnalyticalDevlopRawAction(projectId, rawId);

        if (isActionError(res)) {
          alert(getActionMessage(res, "خطا در حذف رکورد."));
          return;
        }

        // بررسی اینکه اگر فقط یک آیتم بود و حذف شد وضعیت بلافاصله آپدیت شود
        if (rawList.length <= 1) {
          onDataStatusChange?.(false);
        }

        await loadData();
      } catch (err) {
        console.error("Error deleting record:", err);
        alert("خطا در حذف رکورد.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading Analytical Develop Raw module...
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
            Step 2: Analytical Method Development
          </h3>
          <p className="mt-0.5 text-xs text-stone-500">
            Manage raw material specifications, MOA, and DMF documents
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
          Add Raw Material
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs md:text-sm">
          <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
            <tr>
              <th className="min-w-[150px] px-4 py-3">Material Name</th>
              <th className="min-w-[140px] px-4 py-3">Manufacturer</th>
              <th className="min-w-[140px] px-4 py-3">Specification</th>
              <th className="min-w-[140px] px-4 py-3">MOA</th>
              <th className="min-w-[140px] px-4 py-3">DMF</th>
              <th className="w-32 px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 text-stone-700">
            {/* New Row Input */}
            {isAdding && (
              <tr className="border-b-2 border-blue-200 bg-blue-50/40">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Material name *"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    placeholder="Manufacturer"
                    value={newManufactor}
                    onChange={(e) => setNewManufactor(e.target.value)}
                    className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) => setNewSpecFile(e.target.files?.[0] || null)}
                    className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-blue-800"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) => setNewMoaFile(e.target.files?.[0] || null)}
                    className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-blue-800"
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="file"
                    onChange={(e) => setNewDmfFile(e.target.files?.[0] || null)}
                    className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-0.5 file:text-xs file:font-medium file:text-blue-800"
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
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
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
                    Loading raw material records...
                  </div>
                </td>
              </tr>
            ) : rawList.length === 0 && !isAdding ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  No analytical raw material records found for this project.
                </td>
              </tr>
            ) : (
              rawList.map((item) => {
                const isEditing = editingId === item.id;

                if (isEditing) {
                  return (
                    <tr key={item.id} className="bg-blue-50/30">
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={editManufactor}
                          onChange={(e) => setEditManufactor(e.target.value)}
                          className="w-full rounded-md border border-stone-300 bg-white px-2 py-1 text-xs focus:border-blue-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {item.specFileUrl && (
                          <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[120px]">
                            {getFileName(item.specFileUrl)}
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditSpecFile(e.target.files?.[0] || null)
                          }
                          className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-blue-100 file:px-1.5 file:py-0.5 file:text-[11px]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {item.moaFileUrl && (
                          <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[120px]">
                            {getFileName(item.moaFileUrl)}
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditMoaFile(e.target.files?.[0] || null)
                          }
                          className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-blue-100 file:px-1.5 file:py-0.5 file:text-[11px]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {item.dmfFileUrl && (
                          <div className="mb-1 text-[11px] text-stone-500 truncate max-w-[120px]">
                            {getFileName(item.dmfFileUrl)}
                          </div>
                        )}
                        <input
                          type="file"
                          onChange={(e) =>
                            setEditDmfFile(e.target.files?.[0] || null)
                          }
                          className="block w-full cursor-pointer text-[11px] text-stone-500 file:mr-1 file:rounded file:border-0 file:bg-blue-100 file:px-1.5 file:py-0.5 file:text-[11px]"
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
                      {item.name}
                    </td>

                    <td className="px-4 py-3 text-stone-600">
                      {item.manufactor || (
                        <span className="italic text-stone-400">-</span>
                      )}
                    </td>

                    {/* Spec File */}
                    <td className="px-4 py-3">
                      {item.specFileUrl ? (
                        <a
                          href={getFileUrl(item.specFileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-3.5-3.5M12 16l3.5-3.5" />
                          </svg>
                          Spec
                        </a>
                      ) : (
                        <span className="text-xs italic text-stone-400">-</span>
                      )}
                    </td>

                    {/* MOA File */}
                    <td className="px-4 py-3">
                      {item.moaFileUrl ? (
                        <a
                          href={getFileUrl(item.moaFileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700 hover:bg-purple-100"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-3.5-3.5M12 16l3.5-3.5" />
                          </svg>
                          MOA
                        </a>
                      ) : (
                        <span className="text-xs italic text-stone-400">-</span>
                      )}
                    </td>

                    {/* DMF File */}
                    <td className="px-4 py-3">
                      {item.dmfFileUrl ? (
                        <a
                          href={getFileUrl(item.dmfFileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 4v12m0 0l-3.5-3.5M12 16l3.5-3.5" />
                          </svg>
                          DMF
                        </a>
                      ) : (
                        <span className="text-xs italic text-stone-400">-</span>
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
                          aria-label="Edit raw material"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(item.id)}
                          className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 hover:text-rose-700 active:scale-95 disabled:opacity-50"
                          title="Delete"
                          aria-label="Delete raw material"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
