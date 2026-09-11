"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import ScrollReveal from "@/components/ScrollReveal";
import { getCategories, getProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useLang } from "@/context/LangContext";

function ShopInner() {
  const { t } = useLang();
  const router = useRouter();
  const sp = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<{ name: string; slug: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const q = sp.get("q") ?? "";
  const metal = sp.get("metal") ?? "";
  const category = sp.get("category") ?? "";
  const newOnly = sp.get("new") === "1";

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getProducts({ q, metal, category, new: newOnly ? 1 : "", per_page: 24 });
        if (!alive) return;
        setProducts(res.data);
        setTotal(res.total);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [q, metal, category, newOnly]);

  useEffect(() => {
    (async () => {
      try { setCategories(await getCategories()); } catch {}
    })();
  }, []);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v); else next.delete(k);
    }
    router.replace(`/shop?${next.toString()}`);
  };

  const activeFilters = [metal && `Metal: ${metal}`, category && `Category: ${category}`, newOnly && "New Arrivals"].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-stone-950 py-16">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/3 w-48 h-48 rounded-full bg-amber-600/5 blur-3xl" />
        </div>
        <div className="absolute inset-0 noise" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Collection</p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">{t("shop")}</h1>
          <p className="mx-auto mt-4 max-w-lg text-stone-400">Explore our handcrafted gold and silver jewellery collection</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* Active filters + mobile toggle */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <button
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-all hover:border-amber-400 hover:text-amber-700 lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6M9 8h6M17 16h6" /></svg>
            Filters
          </button>
          {activeFilters.map((f) => (
            <span key={f} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 border border-amber-200">
              {f}
              <button onClick={() => {
                if (f.startsWith("Metal")) update({ metal: "" });
                else if (f.startsWith("Category")) update({ category: "" });
                else if (f === "New Arrivals") update({ new: "" });
              }} className="ml-0.5 hover:text-amber-900">&times;</button>
            </span>
          ))}
          <p className="ms-auto text-sm text-stone-500">{total} items</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className={`space-y-6 ${mobileFilterOpen ? "block" : "hidden"} lg:block`}>
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">{t("search")}</p>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                <input
                  value={q}
                  onChange={(e) => update({ q: e.target.value })}
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10"
                />
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">{t("metal")}</p>
              <div className="flex flex-wrap gap-2">
                {["", "gold", "silver"].map((m) => (
                  <button
                    key={m || "all"}
                    onClick={() => update({ metal: m })}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-300 ${
                      metal === m
                        ? "bg-stone-900 text-white shadow-lg shadow-stone-900/20"
                        : "border border-stone-200 text-stone-600 hover:border-amber-400 hover:text-amber-700"
                    }`}
                  >
                    {m === "" ? t("allMetals") : m === "gold" ? `✦ ${t("gold")}` : `✦ ${t("silver")}`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">{t("category")}</p>
              <div className="space-y-1">
                <button
                  onClick={() => update({ category: "" })}
                  className={`w-full rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-300 ${
                    !category ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-50"
                  }`}
                >
                  {t("all")}
                </button>
                {categories.map((c) => (
                  <button
                    key={c.slug ?? c.name}
                    onClick={() => update({ category: c.slug ?? c.name })}
                    className={`w-full truncate rounded-xl px-4 py-2.5 text-left text-sm font-medium transition-all duration-300 ${
                      category === (c.slug ?? c.name) ? "bg-stone-900 text-white" : "text-stone-600 hover:bg-stone-50"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product grid */}
          <div>
            {loading ? (
              <div className="grid h-64 place-items-center">
                <div className="flex items-center gap-3 text-stone-400">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-stone-300 border-t-amber-500" />
                  <span className="text-sm font-medium">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="grid h-64 place-items-center text-red-500 text-sm">{error}</div>
            ) : products.length === 0 ? (
              <div className="grid h-64 place-items-center text-stone-400">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-stone-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg>
                  <p className="mt-3 text-sm font-medium">{t("notFound")}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
                {products.map((p, i) => (
                  <div key={p.sku} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 60, 480)}ms` }}>
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="grid min-h-screen place-items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-amber-500" />
      </div>
    }>
      <ShopInner />
    </Suspense>
  );
}
