"use client";

import React, { useEffect, useState, useTransition } from "react";
import BatchFormModal from "@/components/drug-products/BatchFormModal";
import ResultFormModal from "@/components/drug-products/ResultFormModal";
import SpecificationFormModal from "@/components/drug-products/SpecificationFormModal";
import ResultDetailsModal from "@/components/drug-products/ResultDetailsModal";
import ProductInfoTab from "@/components/drug-products/ProductInfoTab";
import ProductSpecificationTab from "@/components/drug-products/ProductSpecificationTab";
import ProductGraphTab from "@/components/drug-products/ProductGraphTab";
import {
  createBatchAction,
  updateBatchAction,
  deleteBatchAction,
} from "@/app/actions/batch-actions";
import {
  createResultAction,
  updateResultAction,
  deleteResultAction,
} from "@/app/actions/result-actions";
import {
  createSpecificationAction,
  updateSpecificationAction,
  deleteSpecificationAction,
} from "@/app/actions/specification-actions";

export default function DrugProductDetailsModal({
  item,
  onClose,
  onProductChange,
}) {
  const [productDetails, setProductDetails] = useState(item);
  const [openBatchId, setOpenBatchId] = useState(null);
  const [openSpecificationId, setOpenSpecificationId] = useState(null);
  const [activeTab, setActiveTab] = useState("details");
  const [pending, startTransition] = useTransition();
  const [detailsState, setDetailsState] = useState({
    result: null,
    specification: null,
  });

  const [batchModal, setBatchModal] = useState({
    isOpen: false,
    mode: "create",
    data: null,
  });

  const [specModal, setSpecModal] = useState({
    isOpen: false,
    mode: "create",
    batchId: null,
    data: null,
  });

  const [specificationModal, setSpecificationModal] = useState({
    isOpen: false,
    mode: "create",
    data: null,
  });

  useEffect(() => {
    setProductDetails(item);
  }, [item]);

  function updateParentAndLocal(nextProduct) {
    setProductDetails(nextProduct);
    if (onProductChange) {
      onProductChange(nextProduct);
    }
  }

  function openResultDetails(result) {
    const specification = Array.isArray(productDetails.specification)
      ? productDetails.specification[0]
      : productDetails.specification || null;

    setDetailsState({
      result,
      specification,
    });
  }

  function closeResultDetails() {
    setDetailsState({
      result: null,
      specification: null,
    });
  }

  function openBatchModal(mode, data = null) {
    setBatchModal({
      isOpen: true,
      mode,
      data,
    });
  }

  function closeBatchModal() {
    setBatchModal({
      isOpen: false,
      mode: "create",
      data: null,
    });
  }

  function openSpecModal(mode, batchId, data = null) {
    setSpecModal({
      isOpen: true,
      mode,
      batchId,
      data,
    });
  }

  function closeSpecModal() {
    setSpecModal({
      isOpen: false,
      mode: "create",
      batchId: null,
      data: null,
    });
  }

  function openSpecificationModal(mode, data = null) {
    setSpecificationModal({
      isOpen: true,
      mode,
      data,
    });
  }

  function closeSpecificationModal() {
    setSpecificationModal({
      isOpen: false,
      mode: "create",
      data: null,
    });
  }

  function mergeUpdatedBatch(updatedBatch) {
    const nextProduct = {
      ...productDetails,
      batches: (productDetails.batches || []).map((batch) =>
        batch.id === updatedBatch.id ? { ...batch, ...updatedBatch } : batch,
      ),
    };

    updateParentAndLocal(nextProduct);
  }

  function appendNewBatch(newBatch) {
    const nextProduct = {
      ...productDetails,
      batches: [...(productDetails.batches || []), newBatch],
    };

    updateParentAndLocal(nextProduct);
  }

  function removeBatch(batchId) {
    const nextProduct = {
      ...productDetails,
      batches: (productDetails.batches || []).filter(
        (batch) => batch.id !== batchId,
      ),
    };

    updateParentAndLocal(nextProduct);
  }

  function appendNewResult(batchId, newResult) {
    const nextProduct = {
      ...productDetails,
      batches: (productDetails.batches || []).map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              results: [...(batch.results || []), newResult],
            }
          : batch,
      ),
    };

    updateParentAndLocal(nextProduct);
  }

  function mergeUpdatedResult(batchId, updatedResult) {
    const nextProduct = {
      ...productDetails,
      batches: (productDetails.batches || []).map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              results: (batch.results || []).map((result) =>
                result.id === updatedResult.id
                  ? { ...result, ...updatedResult }
                  : result,
              ),
            }
          : batch,
      ),
    };

    updateParentAndLocal(nextProduct);
  }

  function removeResult(batchId, resultId) {
    const nextProduct = {
      ...productDetails,
      batches: (productDetails.batches || []).map((batch) =>
        batch.id === batchId
          ? {
              ...batch,
              results: (batch.results || []).filter(
                (result) => result.id !== resultId,
              ),
            }
          : batch,
      ),
    };

    updateParentAndLocal(nextProduct);
  }

  function appendNewSpecification(newSpecification) {
    const nextProduct = {
      ...productDetails,
      specification: [
        ...(Array.isArray(productDetails.specification)
          ? productDetails.specification
          : productDetails.specification
            ? [productDetails.specification]
            : []),
        newSpecification,
      ],
    };

    updateParentAndLocal(nextProduct);
  }

  function mergeUpdatedSpecification(updatedSpecification) {
    const specsArray = Array.isArray(productDetails.specification)
      ? productDetails.specification
      : productDetails.specification
        ? [productDetails.specification]
        : [];

    const nextProduct = {
      ...productDetails,
      specification: specsArray.map((spec) =>
        spec.id === updatedSpecification.id
          ? { ...spec, ...updatedSpecification }
          : spec,
      ),
    };

    updateParentAndLocal(nextProduct);
  }

  function removeSpecification(specificationId) {
    const specsArray = Array.isArray(productDetails.specification)
      ? productDetails.specification
      : productDetails.specification
        ? [productDetails.specification]
        : [];

    const nextProduct = {
      ...productDetails,
      specification: specsArray.filter((spec) => spec.id !== specificationId),
    };

    updateParentAndLocal(nextProduct);
  }

  async function handleSubmitBatch(formData) {
    startTransition(async () => {
      if (batchModal.mode === "create") {
        const result = await createBatchAction(formData);

        if (!result?.success) {
          alert(result?.message || "Create batch failed");
          return;
        }

        const createdBatch = result?.data;
        if (createdBatch) {
          appendNewBatch(createdBatch);
          setOpenBatchId(createdBatch.id);
        }

        closeBatchModal();
        return;
      }

      if (batchModal.mode === "edit" && batchModal.data?.id) {
        const result = await updateBatchAction(batchModal.data.id, formData);

        if (!result?.success) {
          alert(result?.message || "Update batch failed");
          return;
        }

        const updatedBatch = result?.data;
        if (updatedBatch) {
          mergeUpdatedBatch(updatedBatch);
        }

        closeBatchModal();
      }
    });
  }

  function handleDeleteBatch(batchId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this batch?",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteBatchAction(batchId);

      if (!result?.success) {
        alert(result?.message || "Delete batch failed");
        return;
      }

      removeBatch(batchId);

      if (openBatchId === batchId) {
        setOpenBatchId(null);
      }
    });
  }

  async function handleSubmitResult(payload) {
    startTransition(async () => {
      if (specModal.mode === "create") {
        const result = await createResultAction(payload);

        if (result?.error) {
          alert(result?.message || "Create result failed");
          return;
        }

        appendNewResult(specModal.batchId, result);
        closeSpecModal();
        return;
      }

      if (specModal.mode === "edit" && specModal.data?.id) {
        const result = await updateResultAction(specModal.data.id, payload);

        if (result?.error) {
          alert(result?.message || "Update result failed");
          return;
        }

        mergeUpdatedResult(specModal.batchId, result);
        closeSpecModal();
      }
    });
  }

  function handleDeleteResult(batchId, resultId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this result?",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteResultAction(resultId);

      if (result?.error) {
        alert(result?.message || "Delete result failed");
        return;
      }

      removeResult(batchId, resultId);
    });
  }

  async function handleSubmitSpecification(payload) {
    startTransition(async () => {
      if (specificationModal.mode === "create") {
        const result = await createSpecificationAction(payload);

        if (result?.error) {
          alert(result?.message || "Create specification failed");
          return;
        }

        appendNewSpecification(result?.data || result);
        closeSpecificationModal();
        return;
      }

      if (specificationModal.mode === "edit" && specificationModal.data?.id) {
        const result = await updateSpecificationAction(
          specificationModal.data.id,
          payload,
        );

        if (result?.error) {
          alert(result?.message || "Update specification failed");
          return;
        }

        mergeUpdatedSpecification(result?.data || result);
        closeSpecificationModal();
      }
    });
  }

  function handleDeleteSpecification(specificationId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this specification?",
    );
    if (!confirmed) return;

    startTransition(async () => {
      const result = await deleteSpecificationAction(specificationId);

      if (result?.error) {
        alert(result?.message || "Delete specification failed");
        return;
      }

      removeSpecification(specificationId);

      if (openSpecificationId === specificationId) {
        setOpenSpecificationId(null);
      }
    });
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 p-4 backdrop-blur-sm">
        <div className="max-h-[90vh] w-full max-w-6xl overflow-y-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-2xl shadow-slate-300/40">
          <div className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
            <h2 className="text-lg font-black text-slate-800">
              Product Details
            </h2>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-800"
            >
              Close
            </button>
          </div>

          <div className="border-b border-slate-200 bg-slate-100 px-6 pt-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("details")}
                className={`rounded-t-2xl px-4 py-2 text-sm font-bold transition ${
                  activeTab === "details"
                    ? "border border-b-white border-slate-300 bg-white text-slate-900"
                    : "border border-transparent bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800"
                }`}
              >
                Drug
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("specification")}
                className={`rounded-t-2xl px-4 py-2 text-sm font-bold transition ${
                  activeTab === "specification"
                    ? "border border-b-white border-slate-300 bg-white text-slate-900"
                    : "border border-transparent bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800"
                }`}
              >
                Specification
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("graph")}
                className={`rounded-t-2xl px-4 py-2 text-sm font-bold transition ${
                  activeTab === "graph"
                    ? "border border-b-white border-slate-300 bg-white text-slate-900"
                    : "border border-transparent bg-slate-200 text-slate-600 hover:bg-slate-300 hover:text-slate-800"
                }`}
              >
                Stability Graph
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "details" ? (
              <ProductInfoTab
                productDetails={productDetails}
                openBatchId={openBatchId}
                setOpenBatchId={setOpenBatchId}
                onAddBatch={() => openBatchModal("create")}
                onEditBatch={(batch) => openBatchModal("edit", batch)}
                onDeleteBatch={handleDeleteBatch}
                onAddResult={(batchId) => openSpecModal("create", batchId)}
                onEditResult={(batchId, result) =>
                  openSpecModal("edit", batchId, result)
                }
                onDeleteResult={handleDeleteResult}
                onViewResultDetails={openResultDetails}
              />
            ) : activeTab === "specification" ? (
              <ProductSpecificationTab
                specifications={productDetails.specification}
                openSpecificationId={openSpecificationId}
                setOpenSpecificationId={setOpenSpecificationId}
                pending={pending}
                onAddSpecification={() => openSpecificationModal("create")}
                onEditSpecification={(spec) =>
                  openSpecificationModal("edit", spec)
                }
                onDeleteSpecification={handleDeleteSpecification}
              />
            ) : (
              <ProductGraphTab productDetails={productDetails} />
            )}
          </div>
        </div>
      </div>

      {batchModal.isOpen ? (
        <BatchFormModal
          title={batchModal.mode === "create" ? "Add Batch" : "Edit Batch"}
          submitText={
            pending
              ? "Saving..."
              : batchModal.mode === "create"
                ? "Create Batch"
                : "Save Changes"
          }
          defaultValues={{
            batchDate: batchModal.data?.batchDate || "",
            description: batchModal.data?.description || "",
          }}
          onClose={closeBatchModal}
          onSubmit={handleSubmitBatch}
          productId={productDetails.id}
          userId={productDetails.userId || productDetails.user?.id || ""}
        />
      ) : null}

      {specModal.isOpen ? (
        <ResultFormModal
          title={specModal.mode === "create" ? "Add Result" : "Edit Result"}
          submitText={
            pending
              ? "Saving..."
              : specModal.mode === "create"
                ? "Create Result"
                : "Save Changes"
          }
          defaultValues={specModal.data || {}}
          onClose={closeSpecModal}
          onSubmit={handleSubmitResult}
          batchId={specModal.batchId}
          userId={productDetails.userId || productDetails.user?.id || ""}
        />
      ) : null}

      {specificationModal.isOpen ? (
        <SpecificationFormModal
          title={
            specificationModal.mode === "create"
              ? "Add Specification"
              : "Edit Specification"
          }
          submitText={
            pending
              ? "Saving..."
              : specificationModal.mode === "create"
                ? "Create Specification"
                : "Save Changes"
          }
          defaultValues={specificationModal.data || {}}
          onClose={closeSpecificationModal}
          onSubmit={handleSubmitSpecification}
          productId={productDetails.id}
          userId={productDetails.userId || productDetails.user?.id || ""}
        />
      ) : null}

      {detailsState.result ? (
        <ResultDetailsModal
          result={detailsState.result}
          specification={detailsState.specification}
          onClose={closeResultDetails}
        />
      ) : null}
    </>
  );
}
