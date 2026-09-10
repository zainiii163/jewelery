"use client";

import Link from "next/link";
import { fmtMoney } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";

export default function CartPage() {
  const { items, setQty, remove, subtotal } = useCart();
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("cart")}</h1>

      {items.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-stone-500">{t("emptyCart")}</p>
          <Link
            href="/shop"
            className="mt-6 inline-block rounded-full bg-amber-600 px-7 py-3 text-sm font-semibold text-white hover:bg-amber-700"
          >
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {items.map((i) => (
            <div
              key={i.sku}
              className="flex items-center gap-4 rounded-xl border border-stone-200 p-4"
            >
              {i.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={i.image}
                  alt={i.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              ) : (
                <div className="grid h-16 w-16 place-items-center rounded-lg bg-stone-100 text-stone-400">
                  ◆
                </div>
              )}
              <div className="flex-1">
                <p className="font-semibold">{i.name}</p>
                <p className="text-sm text-stone-500">{i.sku}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty(i.sku, i.qty - 1)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-stone-300"
                  aria-label="-"
                >
                  −
                </button>
                <span className="w-8 text-center font-semibold">{i.qty}</span>
                <button
                  onClick={() => setQty(i.sku, i.qty + 1)}
                  className="grid h-8 w-8 place-items-center rounded-full border border-stone-300"
                  aria-label="+"
                >
                  +
                </button>
              </div>
              <span className="w-28 text-end font-semibold">
                {fmtMoney(i.qty * i.unitPrice)}
              </span>
              <button
                onClick={() => remove(i.sku)}
                className="grid h-8 w-8 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-red-600"
                aria-label="Remove"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between rounded-xl bg-stone-50 p-5">
            <span className="font-semibold">{t("total")}</span>
            <span className="text-2xl font-black">{fmtMoney(subtotal)}</span>
          </div>

          <div className="flex justify-end gap-3">
            <Link
              href="/shop"
              className="rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold text-stone-700 hover:border-amber-600"
            >
              {t("continueShopping")}
            </Link>
            <Link
              href="/checkout"
              className="rounded-full bg-amber-600 px-7 py-3 text-sm font-semibold text-white hover:bg-amber-700"
            >
              {t("checkout")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}