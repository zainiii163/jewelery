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
  const [hovered, setHovered] = useState(false);
  const image = product.media[0] ? mediaUrl(product.media[0]) : null;
  const secondImage = product.media[1] ? mediaUrl(product.media[1]) : null;
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
    <div
      className="group overflow-hidden rounded-2xl border border-stone-100 bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link
        href={`/product/${product.sku}`}
        className="relative block aspect-square w-full overflow-hidden bg-stone-50"
      >
        {image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={hovered && secondImage ? secondImage : image}
              alt={product.name}
              className="h-full w-full object-cover transition-all duration-700 ease-out group-hover:scale-105"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </>
        ) : (
          <div className="grid h-full w-full place-items-center text-stone-200">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <circle cx="12" cy="12" r="7" />
              <path d="M12 9a3 3 0 0 1 3 3" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 start-3 flex flex-col gap-1.5">
          {soldOut && (
            <span className="rounded-full bg-stone-900/80 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
              Sold Out
            </span>
          )}
          {product.new_arrival && (
            <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-500/30">
              New
            </span>
          )}
          {product.featured && (
            <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg shadow-rose-500/30">
              Featured
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-3 end-3 grid h-9 w-9 place-items-center rounded-full bg-white/80 text-stone-400 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:text-red-500 hover:shadow-md"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

        {/* Quick add overlay */}
        <div className="absolute inset-x-0 bottom-0 p-4 translate-y-2 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <button
            onClick={handleAdd}
            disabled={soldOut}
            className="w-full rounded-full bg-stone-900/90 py-3 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm transition-all duration-300 hover:bg-amber-600 disabled:opacity-40"
          >
            {added ? "Added to cart" : t("addToCart")}
          </button>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-amber-600">
          <span className="font-semibold">{product.metal_type === "gold" ? t("gold") : t("silver")}</span>
          {product.karat != null && <span className="text-stone-300">|</span>}
          {product.karat != null && <span>{product.karat}K</span>}
          {product.category?.name && (
            <>
              <span className="text-stone-300">|</span>
              <span className="text-stone-400">{product.category.name}</span>
            </>
          )}
        </div>
        <Link
          href={`/product/${product.sku}`}
          className="mt-2 block truncate text-sm font-semibold text-stone-900 transition-colors duration-300 hover:text-amber-700"
        >
          {product.name}
        </Link>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-lg font-bold text-stone-900">{fmtMoney(product.sale_price)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-stone-400">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          {t("weight")}: {Number(product.net_weight).toFixed(3)}g
        </div>
      </div>
    </div>
  );
}
