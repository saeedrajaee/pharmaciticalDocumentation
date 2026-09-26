"use client";

import React from "react";
import { CloseIcon, DeleteIcon } from "../icons";
import { Button } from "./Button";

const DeleteConfirmationModal = ({
  isOpen = true,
  setIsOpen,
  onCancel,
  onConfirm,
  handleConfirm,
  title = "آیا از حذف اطمینان دارید؟",
  confirmText = "بله",
  cancelText = "خیر",
}) => {
  if (!isOpen) return null;

  const closeModal = () => {
    if (onCancel) {
      onCancel();
      return;
    }

    if (typeof setIsOpen === "function") {
      setIsOpen(false);
    }
  };

  const confirmDelete = () => {
    if (typeof onConfirm === "function") {
      onConfirm();
      return;
    }

    if (typeof handleConfirm === "function") {
      handleConfirm();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overflow-x-hidden flex items-center justify-center"
    >
      <div
        className="fixed inset-0 bg-black opacity-50"
        onClick={closeModal}
      />

      <div className="relative p-4 w-full max-w-xl h-full md:h-auto">
        <div className="relative text-center bg-white rounded-lg shadow-lg p-5">
          <button
            type="button"
            className="
              text-gray-400 absolute top-2.5 right-2.5 bg-transparent rounded-lg text-base p-1.5
              ml-auto inline-flex items-center hover:bg-gray-200 hover:text-gray-900
              transition-all duration-200
            "
            onClick={closeModal}
          >
            <CloseIcon />
          </button>

          <div className="flex items-center justify-center text-red-500 mt-4">
            <DeleteIcon className="h-16 w-16" />
          </div>

          <p className="my-6 font-semibold text-xl text-slate-800">
            {title}
          </p>

          <div className="flex justify-center items-center gap-4 mt-8">
            <Button
              type="button"
              onClick={closeModal}
              className="
                px-6 py-2.5
                rounded-xl
                bg-blue-400
                hover:bg-blue-500
                text-white font-semibold
                shadow-md hover:shadow-lg
                transition-all duration-200
                border border-blue-500
                active:scale-95
              "
            >
              {cancelText}
            </Button>

            <Button
              type="button"
              onClick={confirmDelete}
              className="
                px-6 py-2.5
                rounded-xl
                bg-red-400
                hover:bg-red-500
                text-white font-semibold
                shadow-md hover:shadow-lg
                transition-all duration-200
                border border-red-500
                active:scale-95
              "
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
