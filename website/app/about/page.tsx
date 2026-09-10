import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">About Tayyab Jewellers</h1>
      <p className="mt-6 leading-relaxed text-stone-600">
        For over two decades Tayyab Jewellers has crafted bridal sets, rings,
        necklaces, earrings and bangles in 22K gold and sterling silver. Every
        piece begins with carefully sourced metal and is finished by hand in
        our Lahore workshop.
      </p>
      <p className="mt-4 leading-relaxed text-stone-600">
        We believe jewellery is more than ornament — it marks the moments that
        matter. That is why we offer custom design, complimentary polishing for
        life, and a brass-free guarantee on every purchase.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["Verified 22K", "Hallmarked, transparent pricing"],
          ["Custom design", "Turn your idea into a piece"],
          ["Lifetime polish", "Complimentary care for life"],
        ].map(([title, sub]) => (
          <div key={title} className="rounded-2xl border border-stone-200 p-5">
            <p className="font-bold">{title}</p>
            <p className="mt-1 text-sm text-stone-500">{sub}</p>
          </div>
        ))}
      </div>
      <div className="mt-10">
        <Link href="/shop" className="rounded-full bg-amber-600 px-7 py-3 text-sm font-semibold text-white hover:bg-amber-700">
          Browse the collection
        </Link>
      </div>
    </div>
  );
}