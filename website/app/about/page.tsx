import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden bg-stone-950 py-20">
        <div className="absolute inset-0"><div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" /></div>
        <div className="absolute inset-0 noise" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Our Story</p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">About Tayyab Jewellers</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-16">
        <ScrollReveal>
          <div className="prose max-w-none text-center">
            <p className="text-xl leading-relaxed text-stone-600">
              For over two decades Tayyab Jewellers has crafted bridal sets, rings,
              necklaces, earrings and bangles in 22K gold and sterling silver. Every
              piece begins with carefully sourced metal and is finished by hand in
              our Lahore workshop.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <p className="mt-8 text-center text-lg leading-relaxed text-stone-500">
            We believe jewellery is more than ornament — it marks the moments that
            matter. That is why we offer custom design, complimentary polishing for
            life, and a brass-free guarantee on every purchase.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {[
            { icon: "✦", title: "Verified 22K", sub: "Hallmarked, transparent pricing" },
            { icon: "◈", title: "Custom Design", sub: "Turn your idea into a piece" },
            { icon: "◆", title: "Lifetime Polish", sub: "Complimentary care for life" },
          ].map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 150}>
              <div className="group rounded-2xl border border-stone-100 bg-white p-8 text-center shadow-sm transition-all duration-500 hover:shadow-xl hover:shadow-stone-200/50 hover:-translate-y-1">
                <span className="text-3xl gold-gradient-text">{f.icon}</span>
                <p className="mt-4 text-lg font-bold text-stone-900">{f.title}</p>
                <p className="mt-2 text-sm text-stone-500">{f.sub}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:shadow-xl hover:scale-105"
            >
              Browse the Collection
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
