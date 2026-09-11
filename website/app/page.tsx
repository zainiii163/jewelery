"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import ProductCard from "@/components/ProductCard";
import ScrollReveal from "@/components/ScrollReveal";
import { getCategories, getProducts } from "@/lib/api";
import type { Product } from "@/lib/types";
import { useLang } from "@/context/LangContext";

const ANNOUNCEMENTS = [
  "Free delivery on orders over Rs. 5,000",
  "10-day hassle-free returns",
  "Luxury gift packaging included",
  "Book your visit on WhatsApp",
];

export default function HomePage() {
  const { t } = useLang();
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [topSellers, setTopSellers] = useState<Product[]>([]);
  const [featured, setFeatured] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ name: string; slug: string | null; products_count?: number }[]>([]);
  const [announceIdx, setAnnounceIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"new" | "top">("new");
  const [heroSlide, setHeroSlide] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

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
      } catch {}
    })();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setAnnounceIdx((i) => (i + 1) % ANNOUNCEMENTS.length), 3500);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setHeroSlide((s) => (s + 1) % 3), 6000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="overflow-hidden">
      {/* ─── ANNOUNCEMENT BAR ─── */}
      <div className="relative bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 py-2.5 text-center text-xs font-medium text-stone-300 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent animate-gradient" />
        <div className="relative mx-auto max-w-7xl px-4">
          {ANNOUNCEMENTS.map((a, i) => (
            <span key={a} className={`${i === announceIdx ? "inline animate-fade-in-up" : "hidden"}`}>{a}</span>
          ))}
        </div>
      </div>

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[85vh] overflow-hidden bg-stone-950">
        {/* Animated background gradients */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 transition-all duration-[3000ms]"
            style={{
              background: heroSlide === 0
                ? "radial-gradient(ellipse at 30% 50%, rgba(154,107,31,0.15) 0%, transparent 60%), radial-gradient(ellipse at 70% 80%, rgba(196,154,42,0.1) 0%, transparent 50%), linear-gradient(135deg, #0c0a09 0%, #1c1917 50%, #0c0a09 100%)"
                : heroSlide === 1
                ? "radial-gradient(ellipse at 60% 30%, rgba(212,168,67,0.12) 0%, transparent 50%), radial-gradient(ellipse at 20% 70%, rgba(154,107,31,0.08) 0%, transparent 60%), linear-gradient(135deg, #1c1917 0%, #0c0a09 50%, #1c1917 100%)"
                : "radial-gradient(ellipse at 50% 50%, rgba(196,154,42,0.1) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(154,107,31,0.08) 0%, transparent 60%), linear-gradient(135deg, #0c0a09 0%, #292524 50%, #0c0a09 100%)"
            }}
          />
          {/* Floating gold particles */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl animate-float" />
          <div className="absolute bottom-1/3 right-1/4 w-48 h-48 rounded-full bg-amber-600/5 blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 right-1/3 w-32 h-32 rounded-full bg-yellow-500/5 blur-2xl animate-float" style={{ animationDelay: "3s" }} />
        </div>

        {/* Noise overlay */}
        <div className="absolute inset-0 noise" />

        {/* Hero content */}
        <div className="relative z-10 flex min-h-[85vh] items-center">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
            <div className="max-w-2xl">
              {/* Slide 0 */}
              <div className={`transition-all duration-1000 ${heroSlide === 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 absolute"}`}>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">New Collection 2026</span>
                </div>
                <h1 className="mt-6 text-5xl font-black leading-[1.1] text-white sm:text-6xl lg:text-7xl">
                  Handcrafted
                  <span className="block gold-gradient-text">Gold & Silver</span>
                  Jewellery
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-400">
                  Bridal sets, rings, necklaces and bangles — each piece shaped by master craftsmen in Lahore, delivered worldwide.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/shop"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-600/25 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-600/30 hover:scale-105"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative">Shop Collection</span>
                    <svg className="relative h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </Link>
                  <Link
                    href="/appointment"
                    className="inline-flex items-center gap-2 rounded-full border border-stone-600 px-8 py-3.5 text-sm font-bold text-stone-300 transition-all duration-300 hover:border-amber-500 hover:text-amber-400 hover:bg-amber-500/5"
                  >
                    Book Appointment
                  </Link>
                </div>
              </div>

              {/* Slide 1 */}
              <div className={`transition-all duration-1000 ${heroSlide === 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 absolute"}`}>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Limited Time</span>
                </div>
                <h1 className="mt-6 text-5xl font-black leading-[1.1] text-white sm:text-6xl lg:text-7xl">
                  Up to
                  <span className="block gold-gradient-text">50% Off</span>
                  Sale Collection
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-400">
                  Premium jewellery at irresistible prices. Handcrafted excellence, now more accessible than ever.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/shop?featured=1"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-600/25 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative">Shop Sale</span>
                  </Link>
                  <Link
                    href="/custom-request"
                    className="inline-flex items-center gap-2 rounded-full border border-stone-600 px-8 py-3.5 text-sm font-bold text-stone-300 transition-all duration-300 hover:border-amber-500 hover:text-amber-400"
                  >
                    Custom Design
                  </Link>
                </div>
              </div>

              {/* Slide 2 */}
              <div className={`transition-all duration-1000 ${heroSlide === 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 absolute"}`}>
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-amber-400">Custom Orders</span>
                </div>
                <h1 className="mt-6 text-5xl font-black leading-[1.1] text-white sm:text-6xl lg:text-7xl">
                  Your Vision,
                  <span className="block gold-gradient-text">Our Craft</span>
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-relaxed text-stone-400">
                  Turn your dream design into reality. Free consultation with our master jewellers — no obligation.
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/custom-request"
                    className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-amber-600/25 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <span className="relative">Start Designing</span>
                  </Link>
                  <a
                    href="https://wa.me/923001234567?text=Hi%20I%20want%20a%20custom%20jewellery%20design"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-stone-600 px-8 py-3.5 text-sm font-bold text-stone-300 transition-all duration-300 hover:border-green-500 hover:text-green-400"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    WhatsApp Us
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero dots */}
        <div className="absolute bottom-8 left-1/2 z-20 -translate-x-1/2 flex gap-3">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              onClick={() => setHeroSlide(i)}
              className={`rounded-full transition-all duration-500 ${
                heroSlide === i ? "w-10 h-2.5 bg-gradient-to-r from-amber-500 to-amber-400" : "w-2.5 h-2.5 bg-stone-600 hover:bg-stone-500"
              }`}
            />
          ))}
        </div>

        {/* Decorative corner element */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* ─── BRAND TRUST STRIP ─── */}
      <section className="relative -mt-8 z-10">
        <div className="mx-auto max-w-5xl px-4">
          <ScrollReveal>
            <div className="glass rounded-2xl shadow-xl shadow-stone-200/50 px-8 py-6">
              <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {[
                  { num: "20+", label: "Years of Craft" },
                  { num: "22K", label: "Hallmarked Gold" },
                  { num: "5000+", label: "Happy Customers" },
                  { num: "4.9", label: "★ Rating" },
                ].map((s, i) => (
                  <div key={s.label} className="text-center">
                    <p className="text-2xl font-black gold-gradient-text sm:text-3xl">{s.num}</p>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-stone-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ─── BROWSE COLLECTION ─── */}
      <section className="mx-auto max-w-7xl px-4 pt-20 pb-14">
        <ScrollReveal>
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Explore</p>
            <h2 className="mt-3 text-3xl font-black text-stone-900 sm:text-4xl">Browse Collection</h2>
            <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-300" />
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-3 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {categories.slice(0, 12).map((c, i) => {
            const emoji = getEmoji(c.name);
            return (
              <ScrollReveal key={c.slug ?? c.name} delay={i * 80}>
                <Link
                  href={`/shop?category=${encodeURIComponent(c.slug ?? c.name)}`}
                  className="group flex flex-col items-center rounded-2xl border border-stone-100 bg-white p-5 text-center premium-card"
                >
                  <span className="mb-3 text-4xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">{emoji}</span>
                  <p className="text-sm font-bold text-stone-900 group-hover:text-amber-700 transition-colors">{c.name}</p>
                  {c.products_count !== undefined && (
                    <p className="mt-1 text-[11px] text-stone-400">{c.products_count} Products</p>
                  )}
                </Link>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ─── FEATURED PRODUCTS ─── */}
      <section className="relative bg-stone-50 py-20">
        <div className="absolute inset-0 noise opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Curated for you</p>
              <h2 className="mt-3 text-3xl font-black text-stone-900 sm:text-4xl">Special Discounts</h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-300" />
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {featured.slice(0, 4).map((p, i) => (
              <ScrollReveal key={p.sku} delay={i * 100}>
                <ProductCard product={p} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TABS: New Arrivals / Top Sellers ─── */}
      <section className="mx-auto max-w-7xl px-4 py-20">
        <ScrollReveal>
          <div className="mb-12 flex flex-col items-center gap-6">
            <div className="flex gap-1 rounded-full bg-stone-100 p-1">
              {([["new", "New Arrivals"], ["top", "Top Sellers"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`relative rounded-full px-6 py-2.5 text-sm font-bold transition-all duration-300 ${
                    activeTab === key
                      ? "bg-stone-900 text-white shadow-lg shadow-stone-900/20"
                      : "text-stone-500 hover:text-stone-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
          {(activeTab === "new" ? newArrivals : topSellers).slice(0, 8).map((p, i) => (
            <div key={p.sku} className="animate-fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 rounded-full border-2 border-stone-200 px-8 py-3 text-sm font-bold text-stone-700 transition-all duration-300 hover:border-amber-500 hover:text-amber-700 hover:shadow-lg hover:shadow-amber-500/10"
          >
            View All Products
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
          </Link>
        </div>
      </section>

      {/* ─── SHOP BY STYLE ─── */}
      <section className="relative overflow-hidden bg-stone-950 py-20">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full bg-amber-600/5 blur-3xl" />
        </div>
        <div className="absolute inset-0 noise" />
        <div className="relative mx-auto max-w-7xl px-4">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Styles</p>
              <h2 className="mt-3 text-3xl font-black text-white sm:text-4xl">Shop by Category</h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-300" />
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
            {categories.slice(0, 8).map((c, i) => (
              <ScrollReveal key={c.slug ?? c.name} delay={i * 100} direction="scale">
                <Link
                  href={`/shop?category=${encodeURIComponent(c.slug ?? c.name)}`}
                  className="group relative overflow-hidden rounded-2xl bg-stone-900 border border-stone-800 transition-all duration-500 hover:border-amber-500/50 hover:shadow-xl hover:shadow-amber-500/10"
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-stone-800 to-stone-900 grid place-items-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 to-amber-500/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <span className="text-6xl transition-transform duration-500 group-hover:scale-125 group-hover:rotate-6">{getEmoji(c.name)}</span>
                  </div>
                  <div className="p-4 text-center">
                    <p className="font-bold text-white group-hover:text-amber-400 transition-colors">{c.name}</p>
                    {c.products_count !== undefined && (
                      <p className="mt-1 text-xs text-stone-500">{c.products_count} Products</p>
                    )}
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>, title: "Free Delivery", sub: "On orders over Rs. 5,000" },
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>, title: "10-Day Returns", sub: "Hassle-free exchanges" },
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12v10H4V12" /><path d="M22 7H2v5h20V7z" /><path d="M12 22V7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>, title: "Gift Packaging", sub: "Premium luxury boxes" },
              { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>, title: "Quality Assured", sub: "Hallmarked jewellery" },
            ].map((s, i) => (
              <ScrollReveal key={s.title} delay={i * 100}>
                <div className="group flex flex-col items-center text-center rounded-2xl border border-stone-100 bg-white p-6 premium-card">
                  <div className="grid h-14 w-14 place-items-center rounded-xl bg-stone-50 text-stone-600 transition-all duration-300 group-hover:bg-amber-50 group-hover:text-amber-600 group-hover:shadow-lg group-hover:shadow-amber-100">
                    {s.icon}
                  </div>
                  <p className="mt-4 text-sm font-bold text-stone-900">{s.title}</p>
                  <p className="mt-1 text-xs text-stone-500">{s.sub}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="relative bg-stone-50 py-20 overflow-hidden">
        <div className="absolute inset-0 noise opacity-30" />
        <div className="relative mx-auto max-w-7xl px-4">
          <ScrollReveal>
            <div className="mb-12 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-600">Testimonials</p>
              <h2 className="mt-3 text-3xl font-black text-stone-900 sm:text-4xl">Customer Stories</h2>
              <div className="mx-auto mt-4 h-1 w-16 rounded-full bg-gradient-to-r from-amber-500 to-amber-300" />
              <p className="mt-4 text-sm text-stone-500">4.9 ★ (2951 reviews) — Verified</p>
            </div>
          </ScrollReveal>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { name: "Ayesha K.", text: "Bought my bridal set here. The craftsmanship is extraordinary — every stone perfectly set. Worth every rupee.", piece: "Bridal Set" },
              { name: "Farhan M.", text: "Got a custom ring made for my wife's birthday. They turned my rough sketch into something even better than I imagined.", piece: "Custom Ring" },
              { name: "Sana R.", text: "Best jewellery shop in Lahore. Transparent pricing, no hidden charges, and the lifetime polish service is a game changer.", piece: "Gold Necklace" },
            ].map((r, i) => (
              <ScrollReveal key={r.name} delay={i * 150} direction="up">
                <div className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-8 shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1">
                  <div className="mb-5 flex gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ))}
                  </div>
                  <p className="flex-1 text-sm leading-relaxed text-stone-600">&ldquo;{r.text}&rdquo;</p>
                  <div className="mt-6 border-t border-stone-100 pt-5">
                    <p className="text-sm font-bold text-stone-900">{r.name}</p>
                    <p className="mt-0.5 text-xs text-amber-600">{r.piece}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600 py-20 animate-gradient">
        <div className="absolute inset-0 noise" />
        <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full bg-white/10 blur-3xl" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <ScrollReveal direction="scale">
            <h2 className="text-3xl font-black text-white sm:text-4xl">Have a design in mind?</h2>
            <p className="mt-4 text-lg text-amber-100">
              We turn your ideas into handcrafted gold and silver jewellery. Free consultation, no obligation.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/custom-request"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-amber-700 shadow-xl shadow-amber-700/20 transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                Custom Design
                <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
              </Link>
              <a
                href="https://wa.me/923001234567?text=Hi%20Tayyab%20Jewellers"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-8 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:border-white hover:bg-white/10"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                WhatsApp Us
              </a>
            </div>
          </ScrollReveal>
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
