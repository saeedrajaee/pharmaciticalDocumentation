"use client";

import Image from "next/image";
import Link from "next/link";
import UserMenu from "./UserMenu";

export default function Navbar({ isLoggedIn, user, onMenuClick }) {
  return (
    <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10 hover:text-white md:hidden"
          aria-label="باز کردن منو"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
            />
          </svg>
        </button>

        <Link href="/home" className="group flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-sm shadow-slate-950/30 ring-1 ring-white/15 transition-all duration-300 group-hover:bg-white/15">
            <Image
              className="h-8 w-8 object-contain transition-transform duration-500 group-hover:scale-110"
              src="/logo.png"
              alt="Pharmaceutical Management Logo"
              width={40}
              height={40}
              priority
            />
          </div>

          <div className="flex flex-col leading-none">
            <span className="text-base font-black uppercase tracking-wide text-gray-600 transition-colors group-hover:text-white sm:text-lg">
              Pharmaceutical
            </span>
            <span className="mt-1 text-[10px] font-bold tracking-[0.22em] text-white/55 sm:text-xs">
              MANAGEMENT
            </span>
          </div>
        </Link>
      </div>

      <nav className="hidden items-center gap-8 md:flex">
        {[
          { href: "/home", label: "Home" },
          { href: "/home/contract-development", label: "Contract Development" },
          { href: "/home/drug-product", label: "Drug" },
          { href: "/home/batch", label: "Batch" },
          { href: "/home/specification", label: "Specification" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="relative py-1 text-l font-semibold text-white/100 transition-colors hover:text-gray-600 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-0 after:bg-gradient-to-l after:from-sky-600 after:to-sky-300 after:transition-all hover:after:w-full"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="hidden items-center gap-3 md:flex">
        {isLoggedIn ? (
          <UserMenu user={user} />
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-bold text-white/80 transition-all hover:bg-white/10 hover:text-white"
            >
              ورود
            </Link>

            <Link
              href="/auth/sign-up"
              className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-indigo-500/20 transition-all hover:from-sky-400 hover:to-indigo-400 hover:shadow-lg hover:shadow-indigo-500/30"
            >
              ثبت نام
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
