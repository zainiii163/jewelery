import { useCallback, useEffect, useMemo, useState } from "react";
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getToken(): string {
  return localStorage.getItem("jw_admin_token") || "";
}

async function apiRequest<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...opts.headers,
    },
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<T>;
}

/* ── types ── */
interface Payment {
  id: number;
  customer_name: string;
  amount: number;
  method: string;
  type: string;
  reference: string;
  notes: string;
  shop_code: string;
  created_at: string;
}

const METHODS = ["Cash", "Bank", "Card", "JazzCash", "Easypaisa"];
const TYPES = ["Received", "Paid"];

const fmtRs = (n: number) => `Rs ${Number(n).toLocaleString("en-PK", { maximumFractionDigits: 0 })}`;

/* ── helpers ── */
const listPayments = (shopCode: string, params: Record<string, string> = {}) => {
  const q = new URLSearchParams({ shop_code: shopCode, ...params });
  return apiRequest<Payment[]>(`/api/shop/payments?${q.toString()}`);
};

const createPayment = (payload: {
  shop_code: string;
  customer_name: string;
  amount: number;
  method: string;
  type: string;
  reference: string;
  notes: string;
}) => apiRequest<{ ok: boolean; payment: Payment }>("/api/shop/payments", {
  method: "POST",
  body: JSON.stringify(payload),
});

/* ── component ── */
export default function Payments() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  /* form */
  const [form, setForm] = useState({
    customer_name: "",
    amount: "",
    method: "Cash",
    type: "Received",
    reference: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  /* filters */
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filterType, setFilterType] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (from) params.from = from;
      if (to) params.to = to;
      if (filterType) params.type = filterType;
      setRows(await listPayments("MAIN", params));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [from, to, filterType]);

  useEffect(() => { load(); }, [load]);

  /* derived */
  const totalReceived = useMemo(() => rows.filter((r) => r.type === "Received").reduce((s, r) => s + Number(r.amount), 0), [rows]);
  const totalPaid = useMemo(() => rows.filter((r) => r.type === "Paid").reduce((s, r) => s + Number(r.amount), 0), [rows]);

  /* form submit */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createPayment({
        shop_code: "MAIN",
        customer_name: form.customer_name,
        amount: Number(form.amount),
        method: form.method,
        type: form.type,
        reference: form.reference,
        notes: form.notes,
      });
      setForm({ customer_name: "", amount: "", method: "Cash", type: "Received", reference: "", notes: "" });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  /* CSV export */
  const exportCsv = () => {
    const header = "Date,Customer,Amount,Method,Type,Reference,Notes\n";
    const body = rows.map((r) =>
      [
        new Date(r.created_at).toLocaleDateString(),
        `"${r.customer_name}"`,
        r.amount,
        r.method,
        r.type,
        `"${r.reference ?? ""}"`,
        `"${(r.notes ?? "").replace(/"/g, '""')}"`,
      ].join(",")
    ).join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">
          Payments <span className="text-base font-normal text-stone-400">({rows.length})</span>
        </h1>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-700"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            {showForm ? "Cancel" : "+ Add Payment"}
          </button>
        </div>
      </div>

      {/* summary cards */}
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total Received</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{fmtRs(totalReceived)}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Total Paid</p>
          <p className="mt-2 text-2xl font-black text-red-600">{fmtRs(totalPaid)}</p>
        </div>
      </div>

      {/* add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mt-5 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-stone-900">New Payment</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-stone-700">
              Customer Name
              <input
                required
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Amount
              <input
                required
                type="number"
                min="1"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Method
              <select
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              >
                {METHODS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Type
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              >
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Reference
              <input
                value={form.reference}
                onChange={(e) => setForm({ ...form, reference: e.target.value })}
                placeholder="e.g. invoice #"
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </label>
            <label className="block text-sm font-medium text-stone-700">
              Notes
              <input
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </label>
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Payment"}
            </button>
          </div>
        </form>
      )}

      {/* filters */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="block text-sm font-medium text-stone-700">
          From
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="ml-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-amber-500"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          To
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="ml-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-amber-500"
          />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Type
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="ml-2 rounded-lg border border-stone-300 px-3 py-1.5 text-sm outline-none focus:border-amber-500"
          >
            <option value="">All</option>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <button
          onClick={() => { setFrom(""); setTo(""); setFilterType(""); }}
          className="rounded-full border border-stone-300 bg-white px-4 py-1.5 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-700"
        >
          Clear Filters
        </button>
      </div>

      {/* table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-stone-400">No payments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-start">Date</th>
                  <th className="px-4 py-3 text-start">Customer</th>
                  <th className="px-4 py-3 text-end">Amount</th>
                  <th className="px-4 py-3 text-start">Method</th>
                  <th className="px-4 py-3 text-start">Type</th>
                  <th className="px-4 py-3 text-start">Reference</th>
                  <th className="px-4 py-3 text-start">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-stone-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-stone-900">{r.customer_name}</td>
                    <td className={`px-4 py-2.5 text-end font-semibold ${r.type === "Received" ? "text-emerald-600" : "text-red-600"}`}>
                      {r.type === "Paid" && "-"}{fmtRs(r.amount)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                        {r.method}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          r.type === "Received"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-stone-600">{r.reference || "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-stone-500">{r.notes || "—"}</td>
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
