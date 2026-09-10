"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
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

  const q = sp.get("q") ?? "";
  const metal = sp.get("metal") ?? "";
  const category = sp.get("category") ?? "";
  const newOnly = sp.get("new") === "1";

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const res = await getProducts({
          q,
          metal,
          category,
          new: newOnly ? 1 : "",
          per_page: 24,
        });
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
    return () => {
      alive = false;
    };
  }, [q, metal, category, newOnly]);

  useEffect(() => {
    (async () => {
      try {
        setCategories(await getCategories());
      } catch {
        /* categories optional */
      }
    })();
  }, []);

  const update = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    router.replace(`/shop?${next.toString()}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-bold">{t("shop")}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {t("search")}
            </p>
            <input
              value={q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600"
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {t("metal")}
            </p>
            {["", "gold", "silver"].map((m) => (
              <button
                key={m || "all"}
                onClick={() => update({ metal: m })}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  metal === m
                    ? "bg-amber-600 font-semibold text-white"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {m === "" ? t("allMetals") : m === "gold" ? t("gold") : t("silver")}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">
              {t("category")}
            </p>
            <button
              onClick={() => update({ category: "" })}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${
                !category ? "bg-amber-600 font-semibold text-white" : "text-stone-700 hover:bg-stone-100"
              }`}
            >
              {t("all")}
            </button>
            {categories.map((c) => (
              <button
                key={c.slug ?? c.name}
                onClick={() => update({ category: c.slug ?? c.name })}
                className={`block w-full truncate rounded-lg px-3 py-2 text-left text-sm ${
                  category === (c.slug ?? c.name)
                    ? "bg-amber-600 font-semibold text-white"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </aside>

        <div>
          <p className="mb-4 text-sm text-stone-500">
            {total} {t("products") ?? "items"}
          </p>
          {loading ? (
            <div className="grid h-48 place-items-center text-stone-400">{t("loading")}</div>
          ) : error ? (
            <div className="grid h-48 place-items-center text-red-600">{error}</div>
          ) : products.length === 0 ? (
            <div className="grid h-48 place-items-center text-stone-400">{t("notFound")}</div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => (
                <ProductCard key={p.sku} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopInner />
    </Suspense>
  );
}