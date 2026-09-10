"use client";

import Link from "next/link";
import { useLang } from "@/context/LangContext";

export default function Footer() {
  const { t } = useLang();
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "Tayyab Jewellers";
  const year = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-stone-200 bg-stone-950 text-stone-300">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-lg font-bold text-white">{siteName}</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-400">
            Hand-crafted 22K gold and silver jewellery for generations of
            celebrations.
          </p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
            {t("shop")}
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop?metal=gold" className="hover:text-amber-400">
                {t("gold")}
              </Link>
            </li>
            <li>
              <Link href="/shop?metal=silver" className="hover:text-amber-400">
                {t("silver")}
              </Link>
            </li>
            <li>
              <Link href="/custom-request" className="hover:text-amber-400">
                {t("custom")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
            Company
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/about" className="hover:text-amber-400">
                {t("about")}
              </Link>
            </li>
            <li>
              <Link href="/appointment" className="hover:text-amber-400">
                {t("appointment")}
              </Link>
            </li>
            <li>
              <Link href="/contact" className="hover:text-amber-400">
                {t("contact")}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
            {t("storeInfo")}
          </p>
          <ul className="space-y-2 text-sm text-stone-400">
            <li>Shop #12, Johar Market</li>
            <li>Lahore, Pakistan</li>
            <li>+92 300 123 4567</li>
            <li>sales@tayyabjewellers.pk</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800 py-4 text-center text-xs text-stone-500">
        © {year} {siteName}. {t("rights")}
      </div>
    </footer>
  );
}