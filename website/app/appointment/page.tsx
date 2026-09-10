"use client";

import { useState } from "react";
import { createAppointment } from "@/lib/api";
import { useLang } from "@/context/LangContext";

const PURPOSES = ["Buying", "Custom Design", "Repair", "Consultation"];

export default function AppointmentPage() {
  const { t } = useLang();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    date: "",
    time: "17:00",
    purpose: "Buying",
    notes: "",
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
    if (!form.name.trim() || !form.date) {
      setError("Name and date are required");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createAppointment(form);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold">{t("appointmentTitle")}</h1>
      <p className="mt-2 text-stone-500">{t("storeInfo")}</p>

      {done ? (
        <div className="mt-14 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-green-100 text-3xl text-green-700">✓</div>
          <p className="mt-6 text-xl font-bold">{t("bookingConfirmed")}</p>
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
            <input className={input} type="date" value={form.date} onChange={set("date")} />
            <input className={input} type="time" value={form.time} onChange={set("time")} />
            <select className={input} value={form.purpose} onChange={set("purpose")}>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <textarea className={input} rows={3} placeholder={`${t("description")}`} value={form.notes} onChange={set("notes")} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={submit} disabled={busy} className="rounded-full bg-amber-600 px-8 py-3.5 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50">
            {busy ? "…" : t("submit")}
          </button>
        </div>
      )}
    </div>
  );
}