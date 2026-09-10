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
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-stone-500">{t("emptyCart")}</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-amber-600 px-7 py-3 text-sm font-semibold text-white hover:bg-amber-700">
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
        <h1 className="mt-6 text-2xl font-bold">{t("orderPlaced")}</h1>
        <p className="mt-2 text-stone-600">
          {t("orderNumber")}: <span className="font-bold">{result}</span>
        </p>
        <p className="mt-2 text-sm text-stone-500">{t("total")}: {fmtMoney(subtotal)}</p>
        <a
          href={`https://wa.me/923001234567?text=${encodeURIComponent(
            `Salam! I just placed order ${result} on the website. Please confirm it.`
          )}`}
          target="_blank"
          rel="noreferrer"
          className="mt-6 inline-block rounded-full border-2 border-green-600 px-7 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
        >
          {t("confirmOnWhatsapp")}
        </a>
        <Link href="/shop" className="mt-8 inline-block rounded-full bg-amber-600 px-7 py-3 text-sm font-semibold text-white hover:bg-amber-700">
          {t("continueShopping")}
        </Link>
      </div>
    );
  }

  const submit = async () => {
    if (!form.customer_name.trim()) {
      setError("Full name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const o = await createOrder({
        ...form,
        items: items.map((i) => ({ sku: i.sku, qty: i.qty })),
      });
      setResult(o.order_number);
      clear();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Order failed");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600";

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("checkout")}</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <input className={input} placeholder={t("name")} value={form.customer_name} onChange={set("customer_name")} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={input} placeholder={t("phone")} value={form.customer_phone} onChange={set("customer_phone")} />
            <input className={input} type="email" placeholder={t("email")} value={form.customer_email} onChange={set("customer_email")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={input} placeholder={t("city")} value={form.city} onChange={set("city")} />
            <input className={input} placeholder={t("address")} value={form.address} onChange={set("address")} />
          </div>
          <textarea className={input} rows={3} placeholder={`${t("notes")}`} value={form.notes} onChange={set("notes")} />

          <div>
            <p className="mb-2 text-sm font-semibold">{t("paymentMethod")}</p>
            <label className="flex items-center gap-3 rounded-xl border border-amber-600 bg-amber-50 p-4 text-sm font-medium">
              <input type="radio" defaultChecked name="pm" />
              {t("cashOnDelivery")}
            </label>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            onClick={submit}
            disabled={busy}
            className="rounded-full bg-stone-900 px-8 py-3.5 text-sm font-bold text-white hover:bg-stone-800 disabled:opacity-50"
          >
            {busy ? "…" : t("placeOrder")}
          </button>
        </div>

        <aside className="h-fit rounded-xl border border-stone-200 p-5">
          <p className="font-semibold">{t("cart")} ({items.length})</p>
          <div className="mt-3 space-y-2 text-sm">
            {items.map((i) => (
              <div key={i.sku} className="flex justify-between gap-2">
                <span className="truncate">{i.name} ×{i.qty}</span>
                <span>{fmtMoney(i.qty * i.unitPrice)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
            <span className="font-semibold">{t("total")}</span>
            <span className="text-xl font-black">{fmtMoney(subtotal)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}