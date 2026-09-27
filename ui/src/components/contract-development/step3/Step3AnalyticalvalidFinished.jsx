"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  createAnalyticalValidFinishedAction,
  deleteAnalyticalValidFinishedAction,
  getAnalyticalValidFinishedAction,
  updateAnalyticalValidFinishedAction,
} from "@/app/actions/analytical-valid-finished-action";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3002";

/**
 * pharmacopia در Step6 یک boolean است:
 * - true  => Verification
 * - false => Validation
 */
const PHARMACOPOIA_OPTIONS = [
  { label: "Yes", value: "true" },
  { label: "No", value: "false" },
];

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
    const firstError = Object.values(res.details)?.[0]?.[0];
    if (firstError) return firstError;
  }

  return fallback;
};

const getRecordFromResponse = (response) => {
  if (!response) return null;

  if (Array.isArray(response)) return response[0] || null;

  if (response?.data && !Array.isArray(response.data)) return response.data;

  return response;
};

const boolToLabel = (val) => (val === true ? "Verification" : "Validation");

export default function Step6AnalyticalValidFinished({ projectId }) {
  const [mounted, setMounted] = useState(false);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [isEditing, setIsEditing] = useState(false);

  // DTO: pharmacopia?: boolean
  // در FormData بهتر است string بفرستیم: "true" / "false"
  const [pharmacopia, setPharmacopia] = useState(""); // "true" | "false" | ""
  const [assayFile, setAssayFile] = useState(null);
  const [impurityFile, setImpurityFile] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetForm = () => {
    setPharmacopia("");
    setAssayFile(null);
    setImpurityFile(null);
  };

  const loadData = async () => {
    if (!projectId) {
      setRecord(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const response = await getAnalyticalValidFinishedAction(Number(projectId));

      if (isActionError(response)) {
        console.error(
          "Error loading analytical valid finished record:",
          getActionMessage(response, "خطا در دریافت رکورد")
        );
        setRecord(null);
        return;
      }

      const receivedRecord = getRecordFromResponse(response);

      if (receivedRecord?.id) setRecord(receivedRecord);
      else setRecord(null);
    } catch (error) {
      console.error("Error loading analytical valid finished record:", error);
      setRecord(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) loadData();
  }, [projectId, mounted]);

  const startCreate = () => {
    resetForm();
    setIsEditing(true);
  };

  const startEdit = () => {
    if (!record) return;

    // record.pharmacopia boolean است
    setPharmacopia(
      record.pharmacopia === true ? "true" : record.pharmacopia === false ? "false" : ""
    );
    setAssayFile(null);
    setImpurityFile(null);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    resetForm();
    setIsEditing(false);
  };

  const buildFormData = () => {
    const formData = new FormData();

    // در مدل Prisma default=true هست، پس ارسال نکردن هم ok است
    // ولی اگر کاربر انتخاب کرد، ارسال می‌کنیم
    if (pharmacopia !== "") {
      formData.append("pharmacopia", pharmacopia); // "true"/"false"
    }

    // نام‌ها باید دقیقاً مطابق کنترلر باشد:
    if (assayFile) formData.append("assayFile", assayFile);
    if (impurityFile) formData.append("impurityFile", impurityFile);

    return formData;
  };

  const handleSave = () => {
    if (!projectId) {
      alert("شناسه پروژه وجود ندارد.");
      return;
    }

    // اگر می‌خواهید انتخاب برای کاربر اجباری باشد، این شرط را نگه دارید.
    // اگر می‌خواهید به default=true تکیه کنید، این شرط را حذف کنید.
    if (pharmacopia === "") {
      alert("لطفاً نوع را انتخاب نمایید (Verification/Validation).");
      return;
    }

    startTransition(async () => {
      try {
        const formData = buildFormData();

        const response = record
          ? await updateAnalyticalValidFinishedAction(Number(projectId), formData)
          : await createAnalyticalValidFinishedAction(Number(projectId), formData);

        if (isActionError(response)) {
          alert(
            getActionMessage(
              response,
              record
                ? "خطا در به‌روزرسانی اطلاعات Analytical Valid Finished."
                : "خطا در ثبت اطلاعات Analytical Valid Finished."
            )
          );
          return;
        }

        setIsEditing(false);
        resetForm();
        await loadData();
      } catch (error) {
        console.error("Error saving analytical valid finished record:", error);
        alert("خطا در ذخیره رکورد.");
      }
    });
  };

  const handleDelete = () => {
    if (!projectId || !record) return;

    const confirmed = window.confirm(
      "آیا از حذف رکورد Analytical Valid Finished اطمینان دارید؟"
    );
    if (!confirmed) return;

    startTransition(async () => {
      try {
        const response = await deleteAnalyticalValidFinishedAction(Number(projectId));

        if (isActionError(response)) {
          alert(getActionMessage(response, "خطا در حذف رکورد."));
          return;
        }

        setRecord(null);
        resetForm();
        setIsEditing(false);
        await loadData();
      } catch (error) {
        console.error("Error deleting analytical valid finished record:", error);
        alert("خطا در حذف رکورد.");
      }
    });
  };

  if (!mounted) {
    return (
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-6 text-center text-xs text-stone-400">
        Loading Analytical Valid Finished module...
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
      dir="ltr"
      suppressHydrationWarning
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50/80 px-4 py-3.5">
        <div>
          <h3 className="text-sm font-bold text-stone-800">
            Step 6: Analytical Valid Finished
          </h3>

          <p className="mt-0.5 text-xs text-stone-500">
            Manage Verification/Validation and Assay/Impurity files
          </p>
        </div>

        {!isEditing && (
          <div className="flex items-center gap-2">
            {!record && (
              <button
                type="button"
                disabled={isPending || loading || !projectId}
                onClick={startCreate}
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
                Add Finished Record
              </button>
            )}

            {record && (
              <>
                <button
                  type="button"
                  disabled={isPending || loading}
                  onClick={startEdit}
                  className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-50"
                  title="Edit"
                  aria-label="Edit finished record"
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
                  disabled={isPending || loading}
                  onClick={handleDelete}
                  className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
                  title="Delete"
                  aria-label="Delete finished record"
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
              </>
            )}
          </div>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-stone-400">
            <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
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
            Loading finished record...
          </div>
        ) : isEditing ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                Pharmacopia
              </label>

              <select
                value={pharmacopia}
                onChange={(event) => setPharmacopia(event.target.value)}
                disabled={isPending}
                className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-xs text-stone-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-stone-100"
              >
                <option value="">Select type</option>
                {PHARMACOPOIA_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                Assay File
              </label>

              {record?.assayFileUrl && (
                <div className="mb-1 truncate text-[11px] text-stone-500">
                  Current: {getFileName(record.assayFileUrl)}
                </div>
              )}

              <input
                type="file"
                disabled={isPending}
                onChange={(event) => setAssayFile(event.target.files?.[0] || null)}
                className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-800"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-stone-700">
                Impurity File
              </label>

              {record?.impurityFileUrl && (
                <div className="mb-1 truncate text-[11px] text-stone-500">
                  Current: {getFileName(record.impurityFileUrl)}
                </div>
              )}

              <input
                type="file"
                disabled={isPending}
                onChange={(event) =>
                  setImpurityFile(event.target.files?.[0] || null)
                }
                className="block w-full cursor-pointer text-xs text-stone-500 file:mr-2 file:rounded-md file:border-0 file:bg-blue-100 file:px-2 file:py-1 file:text-xs file:font-medium file:text-blue-800"
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSave}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {isPending ? "Saving..." : record ? "Update" : "Save"}
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={cancelEdit}
                className="rounded-lg border border-stone-300 bg-stone-100 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-200 disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : record ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs md:text-sm">
              <thead className="border-b border-stone-200 bg-stone-100/70 font-bold text-stone-700">
                <tr>
                  <th className="min-w-[160px] px-4 py-3">
                    Pharmacopia (Type)
                  </th>
                  <th className="min-w-[160px] px-4 py-3">
                    Assay File
                  </th>
                  <th className="min-w-[160px] px-4 py-3">
                    Impurity File
                  </th>
                </tr>
              </thead>

              <tbody>
                <tr className="text-stone-700">
                  <td className="px-4 py-4 font-semibold text-green-700">
                    {/* شرط شما: اگر yes انتخاب کرد => Verification، اگر نداشت => Validation
                        چون ما در UI به جای yes/no از true/false استفاده کردیم:
                        true => Verification, false => Validation
                    */}
                    {boolToLabel(record.pharmacopia)}
                  </td>

                  <td className="px-4 py-4">
                    {record.assayFileUrl ? (
                      <a
                        href={getFileUrl(record.assayFileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
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
                        Assay
                      </a>
                    ) : (
                      <span className="italic text-stone-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    {record.impurityFileUrl ? (
                      <a
                        href={getFileUrl(record.impurityFileUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100"
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
                        Impurity
                      </a>
                    ) : (
                      <span className="italic text-stone-400">-</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-10 text-center text-xs text-stone-400">
            No Analytical Valid Finished record exists for this project.
          </div>
        )}
      </div>
    </div>
  );
}
