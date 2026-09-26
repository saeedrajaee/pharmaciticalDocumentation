"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/lib/logout";

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/home/contract-development", label: "Contract Development" },
  { href: "/home/drug-product", label: "Drug" },
  { href: "/home/batch", label: "Batch" },
  { href: "/home/specification", label: "Specification" },
];

export default function MobileMenu({ isOpen, onClose, isLoggedIn, user }) {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] md:hidden">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 h-full w-full bg-slate-950/70 backdrop-blur-sm"
        aria-label="بستن منوی موبایل"
      />

      <aside className="absolute right-0 top-0 z-10 flex h-full w-80 max-w-[85vw] flex-col border-l border-rose-100 bg-white/95 p-6 text-right text-slate-800 shadow-[0_10px_40px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="mb-8 flex flex-row-reverse items-center justify-between border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
            aria-label="بستن"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.2"
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
            <h2 className="text-base font-extrabold text-slate-800">
              منوی ناوبری
            </h2>
          </div>
        </div>

        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={[
                  "group relative rounded-2xl px-4 py-3.5 text-base font-extrabold transition-all duration-200",
                  "focus-visible:bg-rose-50 focus-visible:text-rose-700 focus-visible:outline-none",
                  "active:scale-[0.98] active:bg-rose-100 active:text-rose-700",
                  isActive
                    ? "bg-rose-50 text-rose-700"
                    : "text-slate-700 hover:bg-rose-50 hover:text-rose-700",
                ].join(" ")}
              >
                <span className="relative inline-block">
                  {item.label}
                  <span
                    className={[
                      "absolute -bottom-1 right-0 h-0.5 rounded-full bg-rose-600 transition-all duration-300",
                      isActive
                        ? "w-full"
                        : "w-0 group-hover:w-full group-focus-visible:w-full group-active:w-full",
                    ].join(" ")}
                  />
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-slate-200 pt-6">
          {isLoggedIn ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 20.25a8.25 8.25 0 1115 0"
                    />
                  </svg>
                </div>

                <div className="flex min-w-0 flex-col text-right">
                  <span className="truncate text-sm font-bold text-slate-800">
                    {user?.name || "کاربر"}
                  </span>
                  <span className="text-xs text-slate-500">
                    نقش: {user?.role || "نامشخص"}
                  </span>
                </div>
              </div>

              <form action={logout}>
                <button
                  type="submit"
                  className="w-full rounded-2xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  خروج از حساب کاربری
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/auth/signin"
                onClick={onClose}
                className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                ورود به حساب کاربری
              </Link>

              <Link
                href="/auth/sign-up"
                onClick={onClose}
                className="flex items-center justify-center rounded-2xl bg-rose-600 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
              >
                ایجاد حساب کاربری
              </Link>
            </div>
          )}
        </div>
      </aside>
    </div>,
    document.body,
  );
}
