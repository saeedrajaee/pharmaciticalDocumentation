"use client";

import React from "react";
import { ShieldCheck, X, AlertCircle } from "lucide-react";

const CompleteConfirmationModal = ({ isOpen, onCancel, onConfirm, isPending }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex justify-between items-center">
          <div className="flex items-center gap-2 text-green-700">
            <ShieldCheck size={24} />
            <span className="font-bold">تایید نهایی پرونده</span>
          </div>
          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-right">
          <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-100 mb-4">
            <AlertCircle className="text-amber-500 shrink-0" size={20} />
            <p className="text-xs text-amber-800 leading-relaxed">
              با تایید نهایی، این پرونده مختومه شده و نتیجه آن برای متقاضی در کارتابل شخصی قابل مشاهده خواهد بود. پس از این مرحله امکان ویرایش اطلاعات وجود ندارد.
            </p>
          </div>
          <p className="text-slate-600 text-sm font-medium">
            آیا از ثبت تایید نهایی و ارسال نتیجه اطمینان دارید؟
          </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 flex gap-3 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-5 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg transition-all"
          >
            انصراف
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-6 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-lg shadow-green-200 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                در حال ثبت...
              </>
            ) : (
              "بله، تایید نهایی شود"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompleteConfirmationModal;
