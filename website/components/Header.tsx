"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-yellow-600 to-amber-400 text-lg font-bold text-white">
            T
          </span>
          <span className="text-lg font-bold tracking-tight text-stone-900">
            {siteName}
          </span>
        </Link>

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

        <div className="ms-auto flex items-center gap-2">
          <button
            onClick={() => setLang(lang === "en" ? "ur" : "en")}
            className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-amber-600 hover:text-amber-700"
            aria-label="Toggle language"
          >
            {lang === "en" ? "اردو" : "EN"}
          </button>
          <Link
            href="/cart"
            className="relative grid h-10 w-10 place-items-center rounded-full text-stone-700 hover:bg-stone-100"
            aria-label={t("cart")}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
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
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl gap-4 overflow-x-auto px-4 pb-2 lg:hidden">
        {NAV.slice(0, 6).map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className="whitespace-nowrap text-sm font-medium text-stone-700 hover:text-amber-700"
          >
            {t(n.key)}
          </Link>
        ))}
      </div>
    </header>
  );
}