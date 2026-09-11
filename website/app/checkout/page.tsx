"use client";

import Link from "next/link";
import { useState } from "react";
import { createOrder, fmtMoney } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { useLang } from "@/context/LangContext";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { t } = useLang();
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    customer_email: "",
    city: "",
    address: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  if (items.length === 0 && !result) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <div className="text-center">
          <p className="text-stone-500">{t("emptyCart")}</p>
          <Link href="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:shadow-xl hover:scale-105">
            {t("continueShopping")}
          </Link>
        </div>
      </div>
    );
  }

  if (result) {
    return (
      <div className="grid min-h-[60vh] place-items-center px-4">
        <div className="animate-scale-in max-w-md text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 shadow-lg shadow-green-100">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h1 className="mt-6 text-2xl font-black text-stone-900">{t("orderPlaced")}</h1>
          <p className="mt-3 text-stone-600">
            {t("orderNumber")}: <span className="font-bold text-amber-700">{result}</span>
          </p>
          <p className="mt-1 text-sm text-stone-500">{t("total")}: {fmtMoney(subtotal)}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href={`https://wa.me/923001234567?text=${encodeURIComponent(`Salam! I just placed order ${result} on the website. Please confirm it.`)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border-2 border-green-600 px-7 py-3 text-sm font-bold text-green-700 transition-all hover:bg-green-50"
            >
              {t("confirmOnWhatsapp")}
            </a>
            <Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-amber-600 px-7 py-3 text-sm font-bold text-white transition-all hover:bg-amber-700">
              {t("continueShopping")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const submit = async () => {
    if (!form.customer_name.trim()) { setError("Full name is required"); return; }
    setBusy(true);
    setError(null);
    try {
      const o = await createOrder({ ...form, items: items.map((i) => ({ sku: i.sku, qty: i.qty })) });
      setResult(o.order_number);
      clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order failed");
    } finally {
      setBusy(false);
    }
  };

  const input = "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10";

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-3xl font-black text-stone-900">{t("checkout")}</h1>

        <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            <input className={input} placeholder={`${t("name")} *`} value={form.customer_name} onChange={set("customer_name")} required />
            <div className="grid gap-4 sm:grid-cols-2">
              <input className={input} placeholder={t("phone")} value={form.customer_phone} onChange={set("customer_phone")} />
              <input className={input} type="email" placeholder={t("email")} value={form.customer_email} onChange={set("customer_email")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <input className={input} placeholder={t("city")} value={form.city} onChange={set("city")} />
              <input className={input} placeholder={t("address")} value={form.address} onChange={set("address")} />
            </div>
            <textarea className={`${input} resize-none`} rows={3} placeholder={`${t("notes")}`} value={form.notes} onChange={set("notes")} />

            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-stone-400">{t("paymentMethod")}</p>
              <label className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium">
                <input type="radio" defaultChecked name="pm" className="accent-amber-600" />
                {t("cashOnDelivery")}
              </label>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              onClick={submit}
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-stone-900 to-stone-800 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-stone-900/20 transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {busy ? "Placing order..." : t("placeOrder")}
            </button>
          </div>

          <aside className="h-fit rounded-2xl border border-stone-100 bg-white p-6 shadow-sm">
            <p className="font-bold text-stone-900">{t("cart")} ({items.length})</p>
            <div className="mt-4 space-y-3 text-sm">
              {items.map((i) => (
                <div key={i.sku} className="flex justify-between gap-2">
                  <span className="truncate text-stone-600">{i.name} ×{i.qty}</span>
                  <span className="shrink-0 font-semibold text-stone-900">{fmtMoney(i.qty * i.unitPrice)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-4">
              <span className="font-bold text-stone-600">{t("total")}</span>
              <span className="text-xl font-black text-stone-900">{fmtMoney(subtotal)}</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
