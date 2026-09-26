"use client";

import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import MobileMenu from "./MobileMenu";

export default function Header({ isLoggedIn, user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={[
        "sticky top-0 z-[9999] w-full overflow-visible",
        "border-b border-white/10",
        "bg-slate-950/60 supports-[backdrop-filter]:bg-slate-950/35",
        "backdrop-blur-xl supports-[backdrop-filter]:backdrop-blur-xl",
        "supports-[backdrop-filter]:backdrop-saturate-150",
        "transition-all duration-300",
        scrolled
          ? "shadow-lg shadow-slate-950/25 supports-[backdrop-filter]:bg-slate-950/45"
          : "shadow-sm shadow-slate-950/10 supports-[backdrop-filter]:bg-slate-950/35",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10" />
        <div className="absolute inset-0 bg-gradient-to-b from-amber-200/10 via-transparent to-transparent" />
      </div>

      <div className="h-[2px] w-full bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 opacity-70" />

      <Navbar
        isLoggedIn={Boolean(isLoggedIn)}
        user={user || null}
        onMenuClick={() => setIsMobileMenuOpen(true)}
      />

      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        isLoggedIn={Boolean(isLoggedIn)}
        user={user || null}
      />
    </header>
  );
}
