"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  createDrugProductAction,
  deleteDrugProductAction,
  updateDrugProductAction,
} from "@/app/actions/drug-product";
import DrugProductDetailsModal from "@/components/drug-products/DrugProductDetailsModal";

const dosageOptions = ["All", "Solution", "Solid", "Semisolid"];

const emptyForm = {
  finishedProductName: "",
  api: "",
  dosageForm: "Solution",
  strength: "",
  strengthUnit: "",
  strongCondition: "",
};

export default function DrugProductsClient({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts || []);
  const [search, setSearch] = useState("");
  const [dosageFilter, setDosageFilter] = useState("All");
  const [detailsItem, setDetailsItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [pending, startTransition] = useTransition();

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const query = search.toLowerCase();

      const matchesSearch =
        item.finishedProductName?.toLowerCase().includes(query) ||
        item.api?.toLowerCase().includes(query) ||
        item.strength?.toLowerCase().includes(query) ||
        item.user?.name?.toLowerCase().includes(query);

      const matchesFilter =
        dosageFilter === "All" || item.dosageForm === dosageFilter;

      return matchesSearch && matchesFilter;
    });
  }, [products, search, dosageFilter]);

  async function handleCreate(formData) {
    const payload = {
      finishedProductName: formData.get("finishedProductName"),
      api: formData.get("api"),
      dosageForm: formData.get("dosageForm"),
      strength: formData.get("strength"),
      strengthUnit: formData.get("strengthUnit"),
      strongCondition: formData.get("strongCondition"),
    };

    startTransition(async () => {
      const result = await createDrugProductAction(payload);

      if (result?.error) {
        alert(result?.message || "Create request failed");
        return;
      }

      if (result?.id) {
        setProducts((prev) => [result, ...prev]);
      } else if (result?.data?.id) {
        setProducts((prev) => [result.data, ...prev]);
      }

      setShowCreate(false);
    });
  }

  async function handleUpdate(formData) {
    if (!editingItem?.id) return;

    const payload = {
      finishedProductName: formData.get("finishedProductName"),
      api: formData.get("api"),
      dosageForm: formData.get("dosageForm"),
      strength: formData.get("strength"),
      strengthUnit: formData.get("strengthUnit"),
      strongCondition: formData.get("strongCondition"),
    };

    startTransition(async () => {
      const result = await updateDrugProductAction(editingItem.id, payload);

      if (result?.error) {
        alert(result?.message || "Update request failed");
        return;
      }

      const updatedItem = result?.data || result;

      setProducts((prev) =>
        prev.map((item) => (item.id === editingItem.id ? updatedItem : item)),
      );

      if (detailsItem?.id === editingItem.id) {
        setDetailsItem(updatedItem);
      }

      setEditingItem(null);
    });
  }

  function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this product?",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteDrugProductAction(id);

      if (result?.error) {
        alert(result?.message || "Delete request failed");
        return;
      }

      setProducts((prev) => prev.filter((item) => item.id !== id));

      if (detailsItem?.id === id) {
        setDetailsItem(null);
      }
    });
  }

  function handleDetailsProductChange(updatedProduct) {
    setProducts((prev) =>
      prev.map((item) =>
        item.id === updatedProduct.id ? updatedProduct : item,
      ),
    );

    setDetailsItem(updatedProduct);
  }

  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-2xl shadow-slate-950/30 backdrop-blur-xl">
        <div className="border-b border-white/10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-wide text-white">
                Drug Products
              </h1>
              <p className="mt-1 text-sm text-white/60">
                Search, filter, create, update, and review product batches
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/home"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Back to Home
              </Link>

              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-sky-400 hover:to-indigo-400 hover:shadow-lg hover:shadow-indigo-500/30"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Search by product name, API, strength, or user"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none transition focus:border-sky-400"
            />

            <select
              value={dosageFilter}
              onChange={(e) => setDosageFilter(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-400"
            >
              {dosageOptions.map((item) => (
                <option
                  key={item}
                  value={item}
                  className="bg-slate-900 text-white"
                >
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="border-b border-slate-600 bg-slate-800/80">
                  <tr className="text-sm text-slate-100">
                    <th className="px-4 py-4 font-semibold">No.</th>
                    <th className="px-4 py-4 font-semibold">Product Name</th>
                    <th className="px-4 py-4 font-semibold">API</th>
                    <th className="px-4 py-4 font-semibold">Dosage Form</th>
                    <th className="px-4 py-4 font-semibold">Strength</th>
                    <th className="px-4 py-4 font-semibold">Storage</th>
                    <th className="px-4 py-4 font-semibold">Batches</th>
                    <th className="px-4 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-700/90">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((item, index) => (
                      <tr
                        key={item.id}
                        className="group bg-slate-900/40 text-sm text-slate-300 transition hover:bg-slate-800/70"
                      >
                        <td className="px-4 py-4 transition group-hover:font-semibold group-hover:text-white">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 font-semibold text-slate-100 transition group-hover:font-bold group-hover:text-white">
                          {item.finishedProductName}
                        </td>
                        <td className="px-4 py-4 transition group-hover:font-semibold group-hover:text-white">
                          {item.api}
                        </td>
                        <td className="px-4 py-4 transition group-hover:font-semibold group-hover:text-white">
                          {item.dosageForm}
                        </td>
                        <td className="px-4 py-4 transition group-hover:font-semibold group-hover:text-white">
                          {item.strength} {item.strengthUnit}
                        </td>
                        <td className="px-4 py-4 transition group-hover:font-semibold group-hover:text-white">
                          {item.strongCondition}
                        </td>
                        <td className="px-4 py-4 transition group-hover:font-semibold group-hover:text-white">
                          {item.batches?.length || 0}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setDetailsItem(item)}
                              className="rounded-xl border border-sky-400/60 bg-sky-500/20 px-3 py-1.5 text-xs font-bold text-sky-100 transition hover:bg-sky-500/30"
                            >
                              Details
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="rounded-xl border border-amber-400/60 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-100 transition hover:bg-amber-500/30"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              disabled={pending}
                              onClick={() => handleDelete(item.id)}
                              className="rounded-xl border border-rose-400/60 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-100 transition hover:bg-rose-500/30 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="8"
                        className="px-4 py-10 text-center text-sm text-slate-400"
                      >
                        No products found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showCreate ? (
        <DrugProductFormModal
          title="Add Drug Product"
          submitText={pending ? "Creating..." : "Create Product"}
          defaultValues={emptyForm}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      ) : null}

      {editingItem ? (
        <DrugProductFormModal
          title="Edit Drug Product"
          submitText={pending ? "Saving..." : "Save Changes"}
          defaultValues={{
            finishedProductName: editingItem.finishedProductName || "",
            api: editingItem.api || "",
            dosageForm: editingItem.dosageForm || "Solution",
            strength: editingItem.strength || "",
            strengthUnit: editingItem.strengthUnit || "",
            strongCondition: editingItem.strongCondition || "",
          }}
          onClose={() => setEditingItem(null)}
          onSubmit={handleUpdate}
        />
      ) : null}

      {detailsItem ? (
        <DrugProductDetailsModal
          item={detailsItem}
          onClose={() => setDetailsItem(null)}
          onProductChange={handleDetailsProductChange}
        />
      ) : null}
    </div>
  );
}

function DrugProductFormModal({
  title,
  submitText,
  defaultValues,
  onClose,
  onSubmit,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-slate-900 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-black text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <form action={onSubmit} className="grid gap-4 p-6 md:grid-cols-2">
          <input
            name="finishedProductName"
            defaultValue={defaultValues.finishedProductName}
            placeholder="Finished Product Name"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-sky-400"
          />

          <input
            name="api"
            defaultValue={defaultValues.api}
            placeholder="API"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-sky-400"
          />

          <select
            name="dosageForm"
            defaultValue={defaultValues.dosageForm}
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none focus:border-sky-400"
          >
            <option value="Solution">Solution</option>
            <option value="Solid">Solid</option>
            <option value="Semisolid">Semisolid</option>
          </select>

          <input
            name="strength"
            defaultValue={defaultValues.strength}
            placeholder="Strength"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-sky-400"
          />

          <input
            name="strengthUnit"
            defaultValue={defaultValues.strengthUnit}
            placeholder="Strength Unit"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-sky-400"
          />

          <input
            name="strongCondition"
            defaultValue={defaultValues.strongCondition}
            placeholder="Storage Condition"
            className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-sky-400"
          />

          <div className="md:col-span-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-bold text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition hover:from-sky-400 hover:to-indigo-400"
            >
              {submitText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
