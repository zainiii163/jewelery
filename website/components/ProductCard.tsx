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
  const [wishlisted, setWishlisted] = useState(false);
  const image = product.media[0] ? mediaUrl(product.media[0]) : null;
  const soldOut = product.status !== "In Stock";

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    setWishlisted(!wishlisted);
  };

  return (
    <div className="group overflow-hidden rounded-xl border border-stone-200 bg-white transition-all hover:shadow-lg">
      <Link
        href={`/product/${product.sku}`}
        className="relative block aspect-square w-full overflow-hidden bg-stone-100"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-stone-300">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
              <circle cx="12" cy="12" r="7" />
              <path d="M12 9a3 3 0 0 1 3 3" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 start-2 flex flex-col gap-1">
          {soldOut && (
            <span className="rounded-full bg-stone-800/80 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
              Sold Out
            </span>
          )}
          {product.new_arrival && (
            <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
              New
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 end-2 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-stone-400 backdrop-blur transition-colors hover:text-red-500"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="w-full rounded-full bg-stone-900/90 py-2.5 text-xs font-bold text-white backdrop-blur transition-colors hover:bg-amber-600 disabled:opacity-40"
          >
            {added ? "✓ Added" : t("addToCart")}
          </button>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-amber-700">
          <span>{product.metal_type === "gold" ? t("gold") : t("silver")}</span>
          {product.karat != null && <span>· {product.karat}K</span>}
          {product.category?.name && <span>· {product.category.name}</span>}
        </div>
        <Link
          href={`/product/${product.sku}`}
          className="mt-1.5 block truncate text-sm font-semibold text-stone-900 hover:text-amber-700"
        >
          {product.name}
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-stone-900">{fmtMoney(product.sale_price)}</span>
        </div>
        <div className="mt-1 text-[11px] text-stone-400">
          {t("weight")}: {Number(product.net_weight).toFixed(3)}g
        </div>
      </div>
    </div>
  );
}
