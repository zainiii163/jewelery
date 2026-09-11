"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { fmtMoney, getProduct, mediaUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";

export default function ProductPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = use(params);
  const { t } = useLang();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    getProduct(sku)
      .then(setProduct)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed"));
  }, [sku]);

  if (loadError) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <p className="text-red-500">{loadError}</p>
          <Link href="/shop" className="mt-4 inline-block text-sm font-semibold text-amber-700 hover:underline">Back to Shop</Link>
        </div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="flex items-center gap-3 text-stone-400">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-amber-500" />
          <span className="text-sm font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  const images = product.media.filter((m) => m.kind === "image");
  const soldOut = product.status !== "In Stock";

  const handleAdd = () => {
    add({
      sku: product.sku,
      name: product.name,
      unitPrice: product.sale_price,
      qty,
      image: images[0] ? mediaUrl(images[0]) : undefined,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <nav className="flex items-center gap-2 text-sm text-stone-400">
          <Link href="/" className="transition-colors hover:text-amber-700">{t("home")}</Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <Link href="/shop" className="transition-colors hover:text-amber-700">{t("shop")}</Link>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m9 18 6-6-6-6" /></svg>
          <span className="text-stone-700">{product.name}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20">
        <div className="grid gap-12 lg:grid-cols-[1fr_1fr]">
          {/* Image gallery */}
          <div className="animate-fade-in-up">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-stone-50">
              {images[active] ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(images[active])}
                    alt={product.name}
                    className={`h-full w-full object-cover transition-all duration-700 ${imageLoaded ? "scale-100 opacity-100" : "scale-105 opacity-0"}`}
                    onLoad={() => setImageLoaded(true)}
                    key={active}
                  />
                  {!imageLoaded && (
                    <div className="absolute inset-0 grid place-items-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-amber-500" />
                    </div>
                  )}
                </>
              ) : (
                <div className="grid h-full w-full place-items-center text-stone-300">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="12" cy="12" r="7" /><path d="M12 9a3 3 0 0 1 3 3" /></svg>
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 start-4 flex flex-col gap-2">
                {soldOut && (
                  <span className="rounded-full bg-stone-900/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">Sold Out</span>
                )}
                {product.new_arrival && (
                  <span className="rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">New</span>
                )}
                {product.featured && (
                  <span className="rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white shadow-lg">Featured</span>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
                {images.map((m, i) => (
                  <button
                    key={m.id}
                    onClick={() => { setActive(i); setImageLoaded(false); }}
                    className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                      i === active
                        ? "border-amber-500 shadow-lg shadow-amber-500/20"
                        : "border-stone-200 opacity-60 hover:opacity-100 hover:border-stone-300"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={mediaUrl(m)} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="animate-fade-in-up" style={{ animationDelay: "200ms" }}>
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-700 border border-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {product.metal_type === "gold" ? t("gold") : t("silver")}
              {product.karat != null ? ` · ${product.karat}K` : ""}
            </p>

            <h1 className="mt-4 text-3xl font-black text-stone-900 sm:text-4xl">{product.name}</h1>
            <p className="mt-2 text-sm text-stone-400">SKU: {product.sku}</p>

            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-4xl font-black text-stone-900">{fmtMoney(product.sale_price)}</span>
            </div>

            {/* Specs grid */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              {[
                { label: t("weight"), value: `${Number(product.net_weight).toFixed(3)} g` },
                { label: t("karat"), value: product.karat != null ? `${product.karat}K` : "—" },
                ...(Number(product.stone_weight) > 0 ? [{ label: "Stone Weight", value: `${Number(product.stone_weight).toFixed(3)} g` }] : []),
                ...(product.purity != null && product.purity > 0 ? [{ label: t("purity") ?? "Purity", value: `${product.purity}%` }] : []),
                { label: t("availability"), value: soldOut ? "Out of Stock" : "In Stock", highlight: !soldOut },
              ].map((spec) => (
                <div key={spec.label} className={`rounded-xl p-3.5 ${spec.highlight ? "bg-green-50 border border-green-200" : "bg-stone-50 border border-stone-100"}`}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">{spec.label}</p>
                  <p className={`mt-1 text-sm font-bold ${spec.highlight ? "text-green-700" : "text-stone-900"}`}>{spec.value}</p>
                </div>
              ))}
            </div>

            {product.description && (
              <p className="mt-6 leading-relaxed text-stone-600">{product.description}</p>
            )}

            {/* Actions */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full border border-stone-200 bg-stone-50">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="grid h-12 w-12 place-items-center text-lg font-bold text-stone-600 transition-colors hover:text-stone-900"
                  >
                    −
                  </button>
                  <span className="w-12 text-center text-lg font-bold">{qty}</span>
                  <button
                    onClick={() => setQty(Math.min(9, qty + 1))}
                    className="grid h-12 w-12 place-items-center text-lg font-bold text-stone-600 transition-colors hover:text-stone-900"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAdd}
                  disabled={soldOut}
                  className="group relative flex-1 overflow-hidden rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-600/20 transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  <span className="relative flex items-center justify-center gap-2">
                    {added ? (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                        Added to Cart
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                        {t("addToCart")}
                      </>
                    )}
                  </span>
                </button>
                <Link
                  href="/checkout"
                  className="flex-1 rounded-full bg-stone-900 px-8 py-3.5 text-center text-sm font-bold text-white transition-all duration-300 hover:bg-stone-800 hover:shadow-xl hover:scale-[1.02]"
                >
                  {t("buyNow")}
                </Link>
              </div>

              <a
                href={`https://wa.me/923001234567?text=${encodeURIComponent(`I am interested in ${product.sku} (${product.name})`)}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-full border border-green-200 bg-green-50 px-6 py-3.5 text-sm font-bold text-green-700 transition-all duration-300 hover:bg-green-100 hover:border-green-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Inquire on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
