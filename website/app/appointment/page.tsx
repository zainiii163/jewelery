"use client";

import { useState } from "react";
import { createAppointment } from "@/lib/api";
import { useLang } from "@/context/LangContext";

const PURPOSES = ["Buying", "Custom Design", "Repair", "Consultation"];

export default function AppointmentPage() {
  const { t } = useLang();
  const [form, setForm] = useState({ name: "", phone: "", date: "", time: "17:00", purpose: "Buying", notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const input = "w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition-all focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/10";

  const submit = async () => {
    if (!form.name.trim() || !form.date) { setError("Name and date are required"); return; }
    setBusy(true);
    setError(null);
    try { await createAppointment(form); setDone(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Request failed"); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-stone-950 py-16">
        <div className="absolute inset-0"><div className="absolute top-1/4 left-1/3 w-64 h-64 rounded-full bg-amber-500/5 blur-3xl" /></div>
        <div className="absolute inset-0 noise" />
        <div className="relative mx-auto max-w-7xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-400">Visit Us</p>
          <h1 className="mt-3 text-4xl font-black text-white sm:text-5xl">{t("appointmentTitle")}</h1>
          <p className="mx-auto mt-4 max-w-lg text-stone-400">{t("storeInfo")}</p>
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 py-12">
        {done ? (
          <div className="animate-scale-in text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-100 shadow-lg shadow-green-100">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-green-600"><polyline points="20 6 9 17 4 12" /></svg>
            </div>
            <p className="mt-6 text-2xl font-black text-stone-900">{t("bookingConfirmed")}</p>
            <button onClick={() => setDone(false)} className="mt-6 rounded-full border-2 border-stone-200 px-6 py-3 text-sm font-bold text-stone-700 transition-all hover:border-amber-400 hover:text-amber-700">
              Book Another
            </button>
          </div>
        ) : (
          <div className="animate-fade-in-up space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className={input} placeholder={`${t("name")} *`} value={form.name} onChange={set("name")} />
              <input className={input} placeholder={t("phone")} value={form.phone} onChange={set("phone")} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <input className={input} type="date" value={form.date} onChange={set("date")} />
              <input className={input} type="time" value={form.time} onChange={set("time")} />
              <select className={input} value={form.purpose} onChange={set("purpose")}>
                {PURPOSES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <textarea className={`${input} resize-none`} rows={3} placeholder={t("description")} value={form.notes} onChange={set("notes")} />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button onClick={submit} disabled={busy} className="w-full rounded-full bg-gradient-to-r from-amber-600 to-amber-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-amber-600/20 transition-all hover:shadow-xl hover:scale-[1.01] disabled:opacity-50">
              {busy ? "Submitting..." : t("submit")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
