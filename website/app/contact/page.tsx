import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Contact Us</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 p-6">
          <p className="font-bold">Visit the store</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Shop #12, Johar Market<br />
            Lahore, Pakistan<br />
            Mon–Sat · 11:00–21:00
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 p-6">
          <p className="font-bold">Reach us</p>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">
            Phone / WhatsApp: +92 300 123 4567<br />
            Email: sales@tayyabjewellers.pk
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <a
          href="https://wa.me/923001234567"
          target="_blank"
          rel="noreferrer"
          className="rounded-full bg-green-600 px-7 py-3 text-sm font-semibold text-white hover:bg-green-700"
        >
          WhatsApp us
        </a>
        <Link href="/appointment" className="rounded-full border border-stone-300 px-7 py-3 text-sm font-semibold text-stone-700 hover:border-amber-600">
          Book an appointment
        </Link>
      </div>
    </div>
  );
}