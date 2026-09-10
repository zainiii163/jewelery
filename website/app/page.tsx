"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/ProductCard";
import { getCategories, getProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useLang } from "@/context/LangContext";

const ANNOUNCEMENTS = [
  "Free delivery on orders over Rs. 5,000",
  "10-day hassle-free returns",
  "Luxury gift packaging included",
  "WhatsApp us: +92 300 123 4567",
];

export default function HomePage() {
  const { t } = useLang();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; slug: string | null; products_count?: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [announceIdx, setAnnounceIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"new" | "top">("new");
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const [n, f, c] = await Promise.all([
          getProducts({ new: 1, per_page: 8 }),
          getProducts({ featured: 1, per_page: 8 }),
          getCategories(),
        ]);
        setNewArrivals(n.data);
        setTopSellers(f.data);
        setFeatured(f.data);
        setCategories(c.filter((x) => x.products_count && x.products_count > 0));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
  }, []);

  // Announcement ticker
  useEffect(() => {
    const id = setInterval(() => setAnnounceIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 3500);
    return () => clearInterval(id);
  }, []);

  // Hero auto-slide
  useEffect(() => {
    const id = setInterval(() => setHeroSlide((s) => (s + 1) % 2), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div>
      {/* ─── ANNOUNCEMENT BAR ─── */}
      <div className="bg-stone-950 py-2 text-center text-xs font-medium text-stone-300">
        <div className="mx-auto max-w-7xl px-4">
          {ANNOUNCEMENTS.map((a, i) => (
            <span key={a} className={`${i === announceIdx ? "inline" : "hidden"}`}>{a}</span>
          ))}
        </div>
      </div>

      {/* ─── HERO SLIDER ─── */}
      <section className="relative overflow-hidden bg-stone-950">
        <div className="relative h-[60vh] min-h-[420px]">
          {/* Slide 1 */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${
              heroSlide === 0 ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="grid h-full place-items-center bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950">
              <div className="text-center px-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">New Collection 2026</p>
                <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl lg:text-7xl">
                  Handcrafted Gold &amp; Silver
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-stone-300">
                  Bridal sets, rings, necklaces and bangles — each piece shaped by master craftsmen.
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <Link href="/shop" className="rounded-full bg-amber-600 px-8 py-3 text-sm font-bold text-white hover:bg-amber-500">
                    {t("shop")} Now
                  </Link>
                  <Link href="/appointment" className="rounded-full border border-stone-500 px-8 py-3 text-sm font-bold text-white hover:border-amber-400 hover:text-amber-300">
                    {t("appointment")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* Slide 2 */}
          <div
            className={`absolute inset-0 transition-opacity duration-1000 ${
              heroSlide === 1 ? "opacity-100" : "opacity-0"
            }`}
          >
            <div className="grid h-full place-items-center bg-gradient-to-br from-amber-950 via-stone-950 to-stone-900">
              <div className="text-center px-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Up to 50% Off</p>
                <h1 className="mt-4 text-4xl font-black text-white sm:text-6xl lg:text-7xl">
                  Sale Collection
                </h1>
                <p className="mx-auto mt-4 max-w-lg text-stone-300">
                  Premium jewellery at irresistible prices. Limited time only.
                </p>
                <div className="mt-8 flex justify-center gap-3">
                  <Link href="/shop?featured=1" className="rounded-full bg-amber-600 px-8 py-3 text-sm font-bold text-white hover:bg-amber-500">
                    Shop Sale
                  </Link>
                  <Link href="/custom-request" className="rounded-full border border-stone-500 px-8 py-3 text-sm font-bold text-white hover:border-amber-400 hover:text-amber-300">
                    {t("custom")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {[0, 1].map((i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className={`h-2 rounded-full transition-all ${
                  heroSlide === i ? "w-8 bg-amber-500" : "w-2 bg-stone-500"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm text-red-600">{error}</div>
      )}

      {/* ─── BROWSE COLLECTION (Category Grid) ─── */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <h2 className="mb-8 text-center text-3xl font-bold">Browse Collection</h2>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {categories.slice(0, 12).map((c) => {
            const emoji = getEmoji(c.name);
            return (
              <Link
                key={c.slug ?? c.name}
                href={`/shop?category=${encodeURIComponent(c.slug ?? c.name)}`}
                className="group flex flex-col items-center rounded-2xl border border-stone-200 bg-stone-50 p-5 text-center transition-all hover:border-amber-400 hover:bg-amber-50 hover:shadow-md"
              >
                <span className="mb-3 text-4xl">{emoji}</span>
                <p className="text-sm font-bold text-stone-900 group-hover:text-amber-700">{c.name}</p>
                {c.products_count !== undefined && (
                  <p className="mt-1 text-[11px] text-stone-500">{c.products_count} Products</p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ─── SPECIAL DISCOUNTS ─── */}
      <section className="bg-stone-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-3xl font-bold">Special Discounts</h2>
            <Link href="/shop?featured=1" className="text-sm font-semibold text-amber-700 hover:underline">
              {t("viewAll")} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.slice(0, 4).map((p) => (
              <ProductCard key={p.sku} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── TABS: New Arrivals / Top Sellers ─── */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-center gap-6 border-b border-stone-200">
          {([["new", "NEW ARRIVALS"], ["top", "TOP SELLERS"]] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`border-b-2 pb-3 text-sm font-bold uppercase tracking-wide transition-colors ${
                activeTab === key
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-stone-400 hover:text-stone-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {(activeTab === "new" ? newArrivals : topSellers).slice(0, 8).map((p) => (
            <ProductCard key={p.sku} product={p} />
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/shop" className="rounded-full border border-stone-300 px-8 py-3 text-sm font-bold text-stone-700 hover:border-amber-500 hover:text-amber-700">
            {t("viewAll")} Products
          </Link>
        </div>
      </section>

      {/* ─── STYLE GRIDS (like RS Zevar) ─── */}
      <section className="bg-stone-50 py-14">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-8 text-center text-3xl font-bold">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((c) => (
              <Link
                key={c.slug ?? c.name}
                href={`/shop?category=${encodeURIComponent(c.slug ?? c.name)}`}
                className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition-shadow hover:shadow-lg"
              >
                <div className="aspect-[4/3] bg-gradient-to-br from-amber-50 to-stone-100 grid place-items-center">
                  <span className="text-6xl">{getEmoji(c.name)}</span>
                </div>
                <div className="p-4 text-center">
                  <p className="font-bold text-stone-900 group-hover:text-amber-700">{c.name}</p>
                  {c.products_count !== undefined && (
                    <p className="mt-1 text-xs text-stone-500">{c.products_count} Products</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURED / BEST SELLERS ─── */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="mb-8 flex items-center justify-between">
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
      </section>

      {/* ─── SERVICES BANNER ─── */}
      <section className="border-y border-stone-200 bg-white py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:grid-cols-4">
          {[
            { icon: "📦", title: "Free Delivery", sub: "On orders over Rs. 5,000" },
            { icon: "🔄", title: "10-Day Returns", sub: "Hassle-free exchanges" },
            { icon: "🎁", title: "Luxury Packaging", sub: "Premium gift boxes" },
            { icon: "✅", title: "Quality Assured", sub: "Hallmarked jewellery" },
          ].map((s) => (
            <div key={s.title} className="flex flex-col items-center text-center">
              <span className="text-3xl">{s.icon}</span>
              <p className="mt-2 text-sm font-bold text-stone-900">{s.title}</p>
              <p className="mt-0.5 text-xs text-stone-500">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-amber-600">What people say</p>
            <h2 className="mt-2 text-3xl font-bold">Customer Stories</h2>
            <p className="mt-2 text-sm text-stone-500">4.81 ★ (2951 reviews) — Verified</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { name: "Ayesha K.", text: "Bought my bridal set here. The craftsmanship is extraordinary — every stone perfectly set. Worth every rupee.", piece: "Bridal Set" },
              { name: "Farhan M.", text: "Got a custom ring made for my wife's birthday. They turned my rough sketch into something even better than I imagined.", piece: "Custom Ring" },
              { name: "Sana R.", text: "Best jewellery shop in Lahore. Transparent pricing, no hidden charges, and the lifetime polish service is a game changer.", piece: "Gold Necklace" },
            ].map((r) => (
              <div key={r.name} className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
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
            <Link href="/custom-request" className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-bold text-amber-700 hover:bg-stone-50">
              {t("custom")}
            </Link>
            <a
              href="https://wa.me/923001234567?text=Hi%20Tayyab%20Jewellers"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3 text-sm font-bold hover:border-white hover:bg-white/10"
            >
              {t("whatsappUs")}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

function getEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("ring")) return "💍";
  if (n.includes("neck") || n.includes("set")) return "📿";
  if (n.includes("bangle") || n.includes("brace")) return "⭕";
  if (n.includes("ear") || n.includes("jhum")) return "✨";
  if (n.includes("pend") || n.includes("locket")) return "🔮";
  if (n.includes("chain") || n.includes("mala")) return "⛓️";
  if (n.includes("bridal")) return "👑";
  if (n.includes("tikka") || n.includes("jhumar") || n.includes("matha")) return "💄";
  return "💎";
}
