"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useLang } from "@/context/LangContext";

export default function HomePage() {
  const { t } = useLang();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; slug: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [n, f, c] = await Promise.all([
          getProducts({ new: 1, per_page: 8 }),
          getProducts({ featured: 1, per_page: 8 }),
          getCategories(),
        ]);
        setNewArrivals(n.data);
        setFeatured(f.data);
        setCategories(c.filter((x) => x.products_count && x.products_count > 0));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div
          className="absolute inset-0 opacity-25"
          style={{
            background:
              "radial-gradient(600px 300px at 20% 30%, #b45309, transparent), radial-gradient(500px 280px at 80% 70%, #78350f, transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-24 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">
            {t("chooseDesign")}
          </p>
          <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-black leading-tight sm:text-6xl">
            {t("gold")} &amp; {t("silver")} Jewellery
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-stone-300">
            Bridal sets, rings, necklaces and bangles — hand-finished by master
            craftsmen.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/shop"
              className="rounded-full bg-amber-600 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-500"
            >
              {t("shop")}
            </Link>
            <Link
              href="/appointment"
              className="rounded-full border border-stone-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:border-amber-400 hover:text-amber-300"
            >
              {t("appointment")}
            </Link>
          </div>
        </div>
      </section>

      {error && (
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-14">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((c) => (
              <Link
                key={c.slug ?? c.name}
                href={`/shop?category=${encodeURIComponent(c.slug ?? c.name)}`}
                className="rounded-full border border-stone-300 px-5 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-amber-600 hover:text-amber-700"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-4">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("newArrivals")}</h2>
          <Link href="/shop?new=1" className="text-sm font-semibold text-amber-700 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {newArrivals.slice(0, 4).map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">{t("featured")}</h2>
          <Link href="/shop" className="text-sm font-semibold text-amber-700 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}