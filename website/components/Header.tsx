"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-white/90 shadow-lg shadow-stone-200/50 backdrop-blur-xl"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:h-20">
          {/* Logo */}
          <Link href="/" className="group relative flex items-center gap-3">
            <div className="relative overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-110">
              <img src="/logo.svg" alt={siteName} className="h-10 w-auto sm:h-12" />
            </div>
            <div className="hidden sm:block">
              <p className={`text-base font-bold tracking-wide transition-colors duration-300 ${scrolled ? "text-stone-900" : "text-stone-900"}`}>
                {siteName}
              </p>
              <p className={`text-[10px] uppercase tracking-[0.2em] transition-colors duration-300 ${scrolled ? "text-amber-600" : "text-amber-500"}`}>
                Fine Jewellery
              </p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="ms-8 hidden flex-1 items-center gap-1 lg:flex">
            {NAV.map((n) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "?");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`group relative rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "text-amber-700"
                      : scrolled
                        ? "text-stone-600 hover:text-stone-900"
                        : "text-stone-700 hover:text-stone-900"
                  }`}
                >
                  {t(n.key)}
                  <span
                    className={`absolute bottom-0 left-1/2 h-0.5 -translate-x-1/2 rounded-full bg-amber-500 transition-all duration-300 ${
                      active ? "w-6" : "w-0 group-hover:w-4"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="ms-auto flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(lang === "en" ? "ur" : "en")}
              className="rounded-full border border-stone-300/60 bg-white/50 px-3 py-1.5 text-xs font-semibold text-stone-700 backdrop-blur-sm transition-all duration-300 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 hover:shadow-sm"
              aria-label="Toggle language"
            >
              {lang === "en" ? "اردو" : "EN"}
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="group relative grid h-10 w-10 place-items-center rounded-full transition-all duration-300 hover:bg-amber-50"
              aria-label={t("cart")}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-colors duration-300 group-hover:text-amber-700"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -end-0.5 grid h-5 min-w-5 animate-bounce place-items-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white shadow-lg shadow-amber-500/30">
                  {count}
                </span>
              )}
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="group relative grid h-10 w-10 place-items-center rounded-full transition-all duration-300 hover:bg-amber-50 lg:hidden"
              aria-label="Toggle menu"
            >
              <div className="flex h-5 w-4 flex-col justify-between">
                <span
                  className={`h-0.5 rounded-full bg-stone-700 transition-all duration-300 origin-center ${
                    menuOpen ? "translate-y-[9px] rotate-45" : ""
                  }`}
                />
                <span
                  className={`h-0.5 rounded-full bg-stone-700 transition-all duration-300 ${
                    menuOpen ? "scale-x-0" : ""
                  }`}
                />
                <span
                  className={`h-0.5 rounded-full bg-stone-700 transition-all duration-300 origin-center ${
                    menuOpen ? "-translate-y-[9px] -rotate-45" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-500 lg:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ${
            menuOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMenuOpen(false)}
        />

        {/* Panel */}
        <div
          className={`absolute right-0 top-0 h-full w-80 bg-white shadow-2xl transition-transform duration-500 ease-out ${
            menuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 items-center justify-between border-b border-stone-100 px-6">
            <span className="text-lg font-bold text-stone-900">Menu</span>
            <button
              onClick={() => setMenuOpen(false)}
              className="grid h-10 w-10 place-items-center rounded-full text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <nav className="flex flex-col gap-1 p-4">
            {NAV.map((n, i) => {
              const active = pathname === n.href || pathname.startsWith(n.href + "?");
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                    active
                      ? "bg-amber-50 text-amber-700"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  } ${menuOpen ? "translate-x-0 opacity-100" : "translate-x-8 opacity-0"}`}
                  style={{ transitionDelay: menuOpen ? `${i * 50}ms` : "0ms" }}
                >
                  {t(n.key)}
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 border-t border-stone-100 p-4">
            <p className="text-center text-xs text-stone-400">
              &copy; {new Date().getFullYear()} {siteName}
            </p>
          </div>
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-16 sm:h-20" />
    </>
  );
}
