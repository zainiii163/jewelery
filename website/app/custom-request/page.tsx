"use client";

import { useState } from "react";
import { createCustomRequest } from "@/lib/api";
import { useLang } from "@/context/LangContext";

export default function CustomRequestPage() {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    jewellery_type: "",
    metal: "gold",
    karat: "22",
    budget: "",
    description: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const input =
    "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600";

  const submit = async () => {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== "" && v !== null) fd.set(k, v);
      });
      await createCustomRequest(fd);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("customTitle")}</h1>
      <p className="mt-2 text-stone-500">{t("describeIdea")}</p>

      {done ? (
        <div className="mt-14 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
          <p className="mt-6 text-xl font-bold">{t("requestSent")}</p>
          <button onClick={() => setDone(false)} className="mt-6 rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold hover:border-amber-600">
            {t("submit")}
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input className={input} placeholder={t("name")} value={form.name} onChange={set("name")} />
            <input className={input} placeholder={t("phone")} value={form.phone} onChange={set("phone")} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <input className={input} placeholder={t("jewelleryType")} value={form.jewellery_type} onChange={set("jewellery_type")} />
            <select className={input} value={form.metal} onChange={set("metal")}>
              <option value="gold">{t("gold")}</option>
              <option value="silver">{t("silver")}</option>
            </select>
            <select className={input} value={form.karat} onChange={set("karat")}>
              {[24, 22, 21, 20, 18].map((k) => (
                <option key={k} value={k}>{k}K</option>
              ))}
            </select>
          </div>
          <input className={input} type="number" placeholder={`${t("budget")} (Rs.)`} value={form.budget} onChange={set("budget")} />
          <textarea className={input} rows={4} placeholder={t("describeIdea")} value={form.description} onChange={set("description")} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={submit} disabled={busy} className="rounded-full bg-amber-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
            {busy ? "…" : t("submit")}
          </button>
        </div>
      )}
    </div>
  );
}