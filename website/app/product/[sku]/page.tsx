"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { fmtMoney, getProduct, mediaUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";

export default function ProductPage({
  params,
}: {
  params: Promise<{ sku: string }>;
}) {
  const { sku } = use(params);
  const { t } = useLang();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    getProduct(sku)
      .then(setProduct)
      .catch((e) => setLoadError(e instanceof Error ? e.message : "Failed"));
  }, [sku]);

  if (loadError) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-red-600">{loadError}</div>;
  }
  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-stone-400">{t("loading")}</div>;
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
    setTimeout(() => setAdded(false), 1200);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <nav className="mb-6 text-sm text-stone-500">
        <Link href="/" className="hover:text-amber-700">{t("home")}</Link>
        <span className="mx-2">/</span>
        <Link href="/shop" className="hover:text-amber-700">{t("shop")}</Link>
        <span className="mx-2">/</span>
        <span className="text-stone-800">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="aspect-square w-full overflow-hidden rounded-2xl bg-stone-100">
            {images[active] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={mediaUrl(images[active])}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-stone-300">
                ◆
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {images.map((m, i) => (
                <button
                  key={m.id}
                  onClick={() => setActive(i)}
                  className={`h-16 w-16 overflow-hidden rounded-lg border-2 ${
                    i === active ? "border-amber-600" : "border-stone-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mediaUrl(m)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            {product.metal_type === "gold" ? t("gold") : t("silver")}
            {product.karat != null ? ` · ${product.karat}K` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>
          <p className="mt-1 text-sm text-stone-500">
            {t("productCode")}: {product.sku}
          </p>

          <p className="mt-6 text-3xl font-black text-stone-900">
            {fmtMoney(product.sale_price)}
          </p>

          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-xl bg-stone-50 p-3">
              <dt className="text-stone-500">{t("weight")}</dt>
              <dd className="mt-1 font-semibold">
                {Number(product.net_weight).toFixed(3)} g
              </dd>
            </div>
            <div className="rounded-xl bg-stone-50 p-3">
              <dt className="text-stone-500">{t("karat")}</dt>
              <dd className="mt-1 font-semibold">
                {product.karat != null ? `${product.karat}K` : "—"}
              </dd>
            </div>
            {Number(product.stone_weight) > 0 && (
              <div className="rounded-xl bg-stone-50 p-3">
                <dt className="text-stone-500">Stone</dt>
                <dd className="mt-1 font-semibold">
                  {Number(product.stone_weight).toFixed(3)} g
                </dd>
              </div>
            )}
            {product.purity != null && product.purity > 0 && (
              <div className="rounded-xl bg-stone-50 p-3">
                <dt className="text-stone-500">{t("purity") ?? "Purity"}</dt>
                <dd className="mt-1 font-semibold">{product.purity}%</dd>
              </div>
            )}
          </dl>

          {product.description && (
            <p className="mt-6 leading-relaxed text-stone-600">{product.description}</p>
          )}

          <p className="mt-6 text-sm">
            {t("availability")}:{" "}
            {soldOut ? (
              <span className="font-semibold text-red-600">{t("notFound")}</span>
            ) : (
              <span className="font-semibold text-green-700">{t("inStock")}</span>
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-full border border-stone-300">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="grid h-11 w-11 place-items-center text-lg"
                aria-label="-"
              >
                −
              </button>
              <span className="w-10 text-center font-semibold">{qty}</span>
              <button
                onClick={() => setQty(Math.min(9, qty + 1))}
                className="grid h-11 w-11 place-items-center text-lg"
                aria-label="+"
              >
                +
              </button>
            </div>
            <button
              onClick={handleAdd}
              disabled={soldOut}
              className="rounded-full bg-amber-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-700 disabled:opacity-40"
            >
              {added ? "✓" : t("addToCart")}
            </button>
            <Link
              href="/checkout"
              className="rounded-full bg-stone-900 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
            >
              {t("buyNow")}
            </Link>
            <a
              href={`https://wa.me/923001234567?text=${encodeURIComponent(
                `I am interested in ${product.sku} (${product.name})`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-green-600 px-6 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
            >
              {t("whatsapp")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}