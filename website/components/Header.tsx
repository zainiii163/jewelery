"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";

const NAV: { href: string; key: string }[] = [
  { href: "/", key: "home" },
  { href: "/shop", key: "shop" },
  { href: "/shop?metal=gold", key: "gold" },
  { href: "/shop?metal=silver", key: "silver" },
  { href: "/appointment", key: "appointment" },
  { href: "/custom-request", key: "custom" },
  { href: "/about", key: "about" },
  { href: "/contact", key: "contact" },
];

export default function Header() {
  const { t, lang, setLang } = useLang();
  const { count } = useCart();
  const pathname = usePathname();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Tayyab Jewellers";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.svg"
              alt={siteName}
              className="h-10 w-auto"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="ms-6 hidden flex-1 items-center gap-5 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`text-sm font-medium transition-colors hover:text-amber-700 ${
                  pathname === n.href || pathname.startsWith(n.href + "?")
                    ? "text-amber-700"
                    : "text-stone-600"
                }`}
              >
                {t(n.key)}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="ms-auto flex items-center gap-1">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "ur" : "en")}
              className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-amber-600 hover:text-amber-700"
              aria-label="Toggle language"
            >
              {lang === "en" ? "اردو" : "EN"}
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative grid h-10 w-10 place-items-center rounded-full text-stone-700 hover:bg-stone-100"
              aria-label={t("cart")}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -end-1 grid h-5 min-w-5 place-items-center rounded-full bg-amber-600 px-1 text-[10px] font-bold text-white">
                  {count}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="grid h-10 w-10 place-items-center rounded-full text-stone-700 hover:bg-stone-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl">
            <div className="flex h-16 items-center justify-between border-b border-stone-200 px-4">
              <span className="text-lg font-bold text-stone-900">Menu</span>
              <button
                onClick={() => setMenuOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full text-stone-700 hover:bg-stone-100"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <nav className="flex flex-col p-4">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    pathname === n.href || pathname.startsWith(n.href + "?")
                      ? "bg-amber-50 text-amber-700"
                      : "text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  {t(n.key)}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
