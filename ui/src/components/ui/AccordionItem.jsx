"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const AccordionSection = ({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = () => {
    if (!disabled) {
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div
      className={`border rounded-2xl mb-4 bg-white shadow-sm overflow-hidden transition-all ${
        isOpen ? "border-indigo-300" : "border-slate-200"
      } ${disabled ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        className={`w-full flex items-center justify-between p-4 transition ${
          isOpen ? "bg-indigo-50" : "bg-slate-50 hover:bg-slate-100"
        }`}
      >
        <div className="flex items-center gap-3 font-bold text-slate-700">
          {Icon && (
            <Icon
              size={20}
              className={`transition-colors duration-200 ${
                isOpen ? "text-indigo-600" : "text-slate-400"
              }`}
            />
          )}
          <span className={isOpen ? "text-indigo-700" : "text-slate-700"}>
            {title}
          </span>
        </div>

        {isOpen ? (
          <ChevronUp className="text-indigo-600 transition-colors" size={20} />
        ) : (
          <ChevronDown className="text-slate-400 transition-colors" size={20} />
        )}
      </button>

      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[1200px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="p-6 border-t border-slate-100">{children}</div>
      </div>
    </div>
  );
};

export default AccordionSection;
