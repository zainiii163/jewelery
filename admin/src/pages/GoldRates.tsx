import { useEffect, useState } from "react";
import { API, getToken } from "../lib/api";

interface GoldRate {
  id: number;
  shop_code: string;
  rate24k: number;
  rate22k: number;
  rate21k: number;
  rate20k: number;
  rate18k: number;
  silver_rate: number;
  created_at: string;
}

const SHOP_CODE = "MAIN";

const fmtRs = (n: number) =>
  "Rs " + Number(n).toLocaleString("en-PK", { maximumFractionDigits: 2 });

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

const calcKarat = (rate24k: number, karat: number) =>
  Math.round((rate24k * karat) / 24 * 100) / 100;

export default function GoldRates() {
  const [rates, setRates] = useState<GoldRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    rate24k: "",
    rate22k: "",
    rate21k: "",
    rate20k: "",
    rate18k: "",
    silver_rate: "",
  });

  const [autoKarat, setAutoKarat] = useState("");
  const [autoResult, setAutoResult] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<{ rates: GoldRate[] }>(
        `/api/shop/gold-rates?shop_code=${SHOP_CODE}`
      );
      setRates(data.rates ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const latest = rates[0] ?? null;

  const updateAutoResult = (karat: string, rate24k: string) => {
    const k = parseInt(karat);
    const r = parseFloat(rate24k || latest?.rate24k.toString() || "0");
    if (k >= 1 && k <= 24 && r > 0) {
      setAutoResult(calcKarat(r, k));
    } else {
      setAutoResult(null);
    }
  };

  const handleAutoKarat = (v: string) => {
    setAutoKarat(v);
    updateAutoResult(v, form.rate24k);
  };

  const handleRate24kChange = (v: string) => {
    setForm((f) => ({ ...f, rate24k: v }));
    if (autoKarat) updateAutoResult(autoKarat, v);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiRequest("/api/shop/gold-rates", {
        method: "POST",
        body: JSON.stringify({
          shop_code: SHOP_CODE,
          rate24k: Number(form.rate24k),
          rate22k: Number(form.rate22k),
          rate21k: Number(form.rate21k),
          rate20k: Number(form.rate20k),
          rate18k: Number(form.rate18k),
          silver_rate: Number(form.silver_rate),
        }),
      });
      setForm({ rate24k: "", rate22k: "", rate21k: "", rate20k: "", rate18k: "", silver_rate: "" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save rate");
    } finally {
      setSubmitting(false);
    }
  };

  const fillFromLatest = () => {
    if (!latest) return;
    setForm({
      rate24k: String(latest.rate24k),
      rate22k: String(latest.rate22k),
      rate21k: String(latest.rate21k),
      rate20k: String(latest.rate20k),
      rate18k: String(latest.rate18k),
      silver_rate: String(latest.silver_rate),
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Gold Rates</h1>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      {/* Current rate KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">24 Karat</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {latest ? fmtRs(latest.rate24k) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">22 Karat</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {latest ? fmtRs(latest.rate22k) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">21 Karat</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {latest ? fmtRs(latest.rate21k) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">18 Karat</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {latest ? fmtRs(latest.rate18k) : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">20 Karat</p>
          <p className="mt-2 text-2xl font-black text-amber-600">
            {latest ? fmtRs(latest.rate20k) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Silver</p>
          <p className="mt-2 text-2xl font-black text-stone-700">
            {latest ? fmtRs(latest.silver_rate) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Last updated</p>
          <p className="mt-2 text-lg font-bold text-stone-900">
            {latest ? new Date(latest.created_at).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total entries</p>
          <p className="mt-2 text-2xl font-black text-stone-900">{rates.length}</p>
        </div>
      </div>

      {/* Karat calculator */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-900">Karat Calculator</h2>
        <p className="mt-1 text-sm text-stone-500">Automatically calculate rate for any karat from 24k rate</p>
        <div className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
              24k Rate
            </label>
            <input
              type="number"
              value={form.rate24k}
              onChange={(e) => handleRate24kChange(e.target.value)}
              placeholder={latest ? String(latest.rate24k) : "e.g. 25000"}
              className="mt-1 w-40 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Karat (1-24)
            </label>
            <input
              type="number"
              min={1}
              max={24}
              value={autoKarat}
              onChange={(e) => handleAutoKarat(e.target.value)}
              placeholder="e.g. 23"
              className="mt-1 w-32 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm">
            <span className="font-semibold text-stone-600">Calculated: </span>
            <span className="text-lg font-bold text-amber-700">
              {autoResult !== null ? fmtRs(autoResult) : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Add new rate form */}
      <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-stone-900">Add New Rate</h2>
            <p className="mt-1 text-sm text-stone-500">Set today's gold and silver buying rates</p>
          </div>
          <button
            type="button"
            onClick={fillFromLatest}
            className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 hover:border-amber-500 hover:text-amber-700"
          >
            Copy from latest
          </button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { key: "rate24k", label: "24K Rate", placeholder: "e.g. 25500" },
            { key: "rate22k", label: "22K Rate", placeholder: "e.g. 23375" },
            { key: "rate21k", label: "21K Rate", placeholder: "e.g. 22313" },
            { key: "rate20k", label: "20K Rate", placeholder: "e.g. 21250" },
            { key: "rate18k", label: "18K Rate", placeholder: "e.g. 19125" },
            { key: "silver_rate", label: "Silver Rate", placeholder: "e.g. 3200" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
                {label}
              </label>
              <input
                type="number"
                required
                value={(form as Record<string, string>)[key]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, [key]: e.target.value }))
                }
                placeholder={placeholder}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>
          ))}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-amber-500 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {submitting ? "Saving…" : "Save Rate"}
            </button>
          </div>
        </form>
      </div>

      {/* Rate history table */}
      <div className="mt-6 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        <div className="px-6 py-4">
          <h2 className="text-lg font-bold text-stone-900">Rate History</h2>
        </div>
        {loading ? (
          <p className="px-6 pb-6 text-stone-400">Loading…</p>
        ) : rates.length === 0 ? (
          <p className="px-6 pb-6 text-stone-400">No rate entries yet. Add your first rate above.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-start">Date</th>
                  <th className="px-4 py-3 text-end">24K</th>
                  <th className="px-4 py-3 text-end">22K</th>
                  <th className="px-4 py-3 text-end">21K</th>
                  <th className="px-4 py-3 text-end">20K</th>
                  <th className="px-4 py-3 text-end">18K</th>
                  <th className="px-4 py-3 text-end">Silver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rates.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2.5 font-medium text-stone-700">
                      {new Date(r.created_at).toLocaleDateString("en-PK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-2.5 text-end font-semibold text-amber-600">
                      {fmtRs(r.rate24k)}
                    </td>
                    <td className="px-4 py-2.5 text-end text-stone-700">{fmtRs(r.rate22k)}</td>
                    <td className="px-4 py-2.5 text-end text-stone-700">{fmtRs(r.rate21k)}</td>
                    <td className="px-4 py-2.5 text-end text-stone-700">{fmtRs(r.rate20k)}</td>
                    <td className="px-4 py-2.5 text-end text-stone-700">{fmtRs(r.rate18k)}</td>
                    <td className="px-4 py-2.5 text-end text-stone-500">{fmtRs(r.silver_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
