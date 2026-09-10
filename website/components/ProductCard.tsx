"use client";

import Link from "next/link";
import { useState } from "react";
import { fmtMoney, mediaUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";

export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { t } = useLang();
  const [added, setAdded] = useState(false);
  const image = product.media[0] ? mediaUrl(product.media[0]) : null;
  const soldOut = product.status !== "In Stock";

  const handleAdd = () => {
    add({
      sku: product.sku,
      name: product.name,
      unitPrice: product.sale_price,
      qty: 1,
      image: image ?? undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition-shadow hover:shadow-lg">
      <Link
        href={`/product/${product.sku}`}
        className="relative block aspect-[4/3] w-full overflow-hidden bg-stone-100"
        aria-hidden
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-stone-300">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="12" cy="12" r="7" />
              <path d="M12 9a3 3 0 0 1 3 3" />
            </svg>
          </div>
        )}
        {soldOut && (
          <span className="absolute top-2 start-2 rounded-full bg-stone-800/80 px-2 py-0.5 text-[11px] font-medium text-white">
            {t("notFound")}
          </span>
        )}
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-amber-700">
          <span>{product.metal_type === "gold" ? t("gold") : t("silver")}</span>
          {product.karat != null && <span>• {product.karat}K</span>}
          {product.category?.name && <span>• {product.category.name}</span>}
        </div>
        <Link
          href={`/product/${product.sku}`}
          className="mt-1 block truncate font-semibold text-stone-900 hover:text-amber-700"
        >
          {product.name}
        </Link>
        <div className="mt-1 text-sm text-stone-500">
          {t("weight")}: {Number(product.net_weight).toFixed(3)}g
        </div>
        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-stone-900">
            {fmtMoney(product.sale_price)}
          </span>
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="rounded-full bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-40"
          >
            {added ? "✓" : t("addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}