"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/logout";
import { CloseIcon, UsersIcon } from "../icons";

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-sm transition hover:bg-white/15"
        aria-expanded={open}
        aria-label="منوی کاربر"
      >
        <span className="text-lg">
          <UsersIcon />
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-14 z-50 w-64 rounded-2xl border border-gray-100 bg-white p-4 shadow-xl">
          <button
            type="button"
            onClick={() => setOpen(false)}
            // تغییر کلاس از left-3 به right-3
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="بستن"
          >
            <CloseIcon />
          </button>

          <div className="mb-4 flex flex-col items-center border-b border-gray-100 pb-4">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl text-blue-700">
              <UsersIcon />
            </div>

            <p className="text-base font-bold text-gray-900">
              {user?.name || "کاربر"}
            </p>

            <p className="mt-2 text-sm text-gray-600">
              <span className="mr-2 rounded-full bg-blue-100 px-3 py-1 text-blue-700">
                {user?.role || "نامشخص"}
              </span>
            </p>
          </div>

          <form action={logout}>
            <button
              type="submit"
              className="w-full rounded-xl bg-red-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-600"
            >
              خروج
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
