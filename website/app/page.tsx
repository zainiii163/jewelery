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
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(700px 400px at 15% 25%, #b45309, transparent), radial-gradient(600px 350px at 85% 75%, #78350f, transparent)",
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:py-36">
          <div className="flex flex-col items-center text-center">
            <span className="mb-6 inline-block rounded-full border border-amber-700/40 bg-amber-900/20 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-amber-400">
              Est. 2000 &middot; Lahore, Pakistan
            </span>
            <h1 className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-6xl lg:text-7xl">
              {t("chooseDesign")}
            </h1>
            <p className="mt-6 max-w-2xl text-lg text-stone-300 leading-relaxed">
              {t("heroSub")}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-amber-500 hover:shadow-lg hover:shadow-amber-600/20"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                {t("shop")}
              </Link>
              <Link
                href="/appointment"
                className="inline-flex items-center gap-2 rounded-full border border-stone-500 px-8 py-3.5 text-sm font-bold text-white transition-all hover:border-amber-400 hover:text-amber-300"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {t("appointment")}
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="relative -mt-10 z-10 mx-auto max-w-5xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { icon: "✦", label: "Verified 22K", sub: "Hallmarked gold" },
            { icon: "⚙", label: "Custom Design", sub: "Your vision, our craft" },
            { icon: "✧", label: "Lifetime Polish", sub: "Free forever" },
            { icon: "✓", label: "Brass-Free", sub: "Pure metal guarantee" },
          ].map((b) => (
            <div
              key={b.label}
              className="flex flex-col items-center rounded-2xl border border-stone-100 bg-white p-5 text-center shadow-sm"
            >
              <span className="mb-2 text-2xl text-amber-600">{b.icon}</span>
              <p className="text-sm font-bold text-stone-900">{b.label}</p>
              <p className="mt-0.5 text-xs text-stone-500">{b.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {error && (
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-red-600">
          {error}
        </div>
      )}

      {/* ─── CATEGORIES ─── */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 pt-20 pb-4">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">Browse by</p>
            <h2 className="mt-2 text-3xl font-bold">Collections</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.slug ?? c.name}
                href={`/shop?category=${encodeURIComponent(c.slug ?? c.name)}`}
                className="group flex flex-col items-center rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center transition-all hover:border-amber-400 hover:bg-amber-50 hover:shadow-md"
              >
                <span className="mb-3 text-4xl">
                  {c.name.toLowerCase().includes("ring")
                    ? "💍"
                    : c.name.toLowerCase().includes("neck")
                      ? "📿"
                      : c.name.toLowerCase().includes("bangle")
                        ? "⭕"
                        : c.name.toLowerCase().includes("ear")
                          ? "✨"
                          : c.name.toLowerCase().includes("brace")
                            ? "⌚"
                            : "💎"}
                </span>
                <p className="font-bold text-stone-900 group-hover:text-amber-700">{c.name}</p>
                {c.products_count !== undefined && (
                  <p className="mt-1 text-xs text-stone-500">
                    {c.products_count} {c.products_count === 1 ? "piece" : "pieces"}
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ─── NEW ARRIVALS ─── */}
      <section className="mx-auto max-w-7xl px-4 pb-6 pt-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">Just dropped</p>
            <h2 className="mt-1 text-3xl font-bold">{t("newArrivals")}</h2>
          </div>
          <Link href="/shop?new=1" className="hidden text-sm font-semibold text-amber-700 hover:underline sm:inline">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {newArrivals.slice(0, 4).map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link href="/shop?new=1" className="text-sm font-semibold text-amber-700 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
      </section>

      {/* ─── VIDEO / CRAFT STORY ─── */}
      <section className="bg-stone-950 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">Our Craft</p>
              <h2 className="mt-3 text-3xl font-bold leading-snug sm:text-4xl">
                Hand-finished by master craftsmen in Lahore
              </h2>
              <p className="mt-4 leading-relaxed text-stone-300">
                Every ring, necklace and bangle starts as raw 22K gold or sterling silver. Our artisans shape, polish
                and set each piece entirely by hand — no machines, no shortcuts. The result is jewellery with character,
                weight and warmth that mass production can never match.
              </p>
              <div className="mt-8 flex flex-wrap gap-6">
                {[
                  ["20+", "Years of craft"],
                  ["5000+", "Pieces delivered"],
                  ["4.9★", "Customer rating"],
                ].map(([num, label]) => (
                  <div key={label}>
                    <p className="text-2xl font-black text-amber-400">{num}</p>
                    <p className="text-sm text-stone-400">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-stone-900 shadow-2xl">
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-stone-500">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 opacity-40">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <p className="text-sm font-medium">Workshop video coming soon</p>
                <p className="mt-1 text-xs text-stone-600">See our craftsmen at work</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURED ─── */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">Curated for you</p>
            <h2 className="mt-1 text-3xl font-bold">{t("featured")}</h2>
          </div>
          <Link href="/shop" className="hidden text-sm font-semibold text-amber-700 hover:underline sm:inline">
            {t("viewAll")} →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
        <div className="mt-6 text-center sm:hidden">
          <Link href="/shop" className="text-sm font-semibold text-amber-700 hover:underline">
            {t("viewAll")} →
          </Link>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="border-t border-stone-200 bg-stone-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">What people say</p>
            <h2 className="mt-2 text-3xl font-bold">Customer Stories</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                name: "Ayesha K.",
                text: "Bought my bridal set here. The craftsmanship is extraordinary — every stone perfectly set. Worth every rupee.",
                piece: "Bridal Set",
              },
              {
                name: "Farhan M.",
                text: "Got a custom ring made for my wife's birthday. They turned my rough sketch into something even better than I imagined.",
                piece: "Custom Ring",
              },
              {
                name: "Sana R.",
                text: "Best jewellery shop in Lahore. Transparent pricing, no hidden charges, and the lifetime polish service is a game changer.",
                piece: "Gold Necklace",
              },
            ].map((r) => (
              <div
                key={r.name}
                className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex gap-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>
                <p className="flex-1 text-sm leading-relaxed text-stone-600">&ldquo;{r.text}&rdquo;</p>
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <p className="text-sm font-bold text-stone-900">{r.name}</p>
                  <p className="text-xs text-stone-500">{r.piece}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="bg-amber-600 py-14 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">Have a design in mind?</h2>
          <p className="mt-3 text-amber-100">
            We turn your ideas into handcrafted gold and silver jewellery. Free consultation, no obligation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/custom-request"
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-amber-700 transition-colors hover:bg-stone-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
              {t("custom")}
            </Link>
            <a
              href="https://wa.me/923001234567?text=Hi%20Tayyab%20Jewellers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-bold transition-colors hover:border-white hover:bg-white/10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              {t("whatsappUs")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
