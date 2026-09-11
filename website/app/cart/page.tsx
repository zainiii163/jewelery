"use client";

import Link from "next/link";
import { fmtMoney } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";

export default function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const { t } = useLang();

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-black text-stone-900">{t("cart")}</h1>

        {items.length === 0 ? (
          <div className="mt-20 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-stone-100">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-stone-400"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
            </div>
            <p className="mt-4 text-lg font-medium text-stone-600">{t("emptyCart")}</p>
            <Link
              href="/shop"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:shadow-xl hover:scale-105"
            >
              {t("continueShopping")}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((i, idx) => (
              <div
                key={i.sku}
                className="animate-fade-in-up flex items-center gap-4 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-all duration-300 hover:shadow-md"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                {i.image ? (
                  <img src={i.image} alt={i.name} className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-xl bg-stone-100 text-stone-300">◆</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-bold text-stone-900">{i.name}</p>
                  <p className="text-sm text-stone-400">{i.sku}</p>
                </div>
                <div className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50">
                  <button
                    onClick={() => setQty(i.sku, i.qty - 1)}
                    className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{i.qty}</span>
                  <button
                    onClick={() => setQty(i.sku, i.qty + 1)}
                    className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    +
                  </button>
                </div>
                <span className="w-28 text-end font-black text-stone-900">{fmtMoney(i.qty * i.unitPrice)}</span>
                <button
                  onClick={() => remove(i.sku)}
                  className="grid h-9 w-9 place-items-center rounded-full text-stone-300 transition-all hover:bg-red-50 hover:text-red-500"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
              </div>
            ))}

            <div className="mt-6 rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-stone-600">{t("total")}</span>
                <span className="text-3xl font-black text-stone-900">{fmtMoney(subtotal)}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <Link
                href="/shop"
                className="rounded-full border-2 border-stone-200 px-6 py-3 text-sm font-bold text-stone-700 transition-all hover:border-amber-400 hover:text-amber-700"
              >
                {t("continueShopping")}
              </Link>
              <Link
                href="/checkout"
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:shadow-xl hover:scale-105"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-400 opacity-0 transition-opacity group-hover:opacity-100" />
                <span className="relative">{t("checkout")}</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
