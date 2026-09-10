import { useCallback, useEffect, useMemo, useState } from "react";
import { API, getToken } from "../lib/api";

interface Expense {
  id: number;
  date: string;
  category: string;
  description: string;
  amount: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface ExpenseForm {
  date: string;
  category: string;
  description: string;
  amount: string;
  payment_method: string;
  notes: string;
}

const CATEGORIES = ["Rent", "Electricity", "Salaries", "Transport", "Packaging", "Repair", "Marketing", "Other"];
const PAYMENT_METHODS = ["Cash", "Bank", "Card", "JazzCash", "Easypaisa"];

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const fmt = (n: number) => "Rs. " + n.toLocaleString("en-PK", { maximumFractionDigits: 0 });

const emptyForm: ExpenseForm = {
  date: today(),
  category: "Other",
  description: "",
  amount: "",
  payment_method: "Cash",
  notes: "",
};

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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

export default function Expenses() {
  const [rows, setRows] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [filterCategory, setFilterCategory] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<{ data: Expense[] }>(
        `/api/shop/expenses?shop_code=MAIN&from=${from}&to=${to}`
      );
      setRows(data.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!filterCategory) return rows;
    return rows.filter((r) => r.category === filterCategory);
  }, [rows, filterCategory]);

  const totalAmount = useMemo(
    () => filtered.reduce((sum, r) => sum + Number(r.amount), 0),
    [filtered]
  );

  const setField = (key: keyof ExpenseForm, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (e: Expense) => {
    setForm({
      date: e.date,
      category: e.category,
      description: e.description,
      amount: String(e.amount),
      payment_method: e.payment_method,
      notes: e.notes ?? "",
    });
    setEditingId(e.id);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleSubmit = async () => {
    if (!form.description.trim() || !form.amount || Number(form.amount) <= 0) {
      setError("Description and a valid amount are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        shop_code: "MAIN",
        date: form.date,
        category: form.category,
        description: form.description.trim(),
        amount: Number(form.amount),
        payment_method: form.payment_method,
        notes: form.notes.trim() || null,
      };
      if (editingId) {
        await apiFetch(`/api/shop/expenses/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
      } else {
        await apiFetch("/api/shop/expenses", {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      closeForm();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this expense?")) return;
    setError(null);
    try {
      await apiFetch(`/api/shop/expenses/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const exportCsv = () => {
    const header = ["Date", "Category", "Description", "Amount", "Payment Method", "Notes"];
    const csvRows = filtered.map((r) =>
      [r.date, r.category, `"${r.description.replace(/"/g, '""')}"`, String(r.amount), r.payment_method, `"${(r.notes ?? "").replace(/"/g, '""')}"`].join(",")
    );
    const csv = [header.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-${today()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">
          Expenses <span className="text-base font-normal text-stone-400">({filtered.length})</span>
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportCsv}
            className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-700"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={openAdd}
            className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
          >
            + Add Expense
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Summary Cards */}
      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Total Expenses</p>
          <p className="mt-1 text-lg font-bold text-stone-900">{fmt(totalAmount)}</p>
          <p className="mt-1 text-xs text-stone-400">{filtered.length} records</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Average</p>
          <p className="mt-1 text-lg font-bold text-stone-900">
            {filtered.length > 0 ? fmt(totalAmount / filtered.length) : fmt(0)}
          </p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Date Range</p>
          <p className="mt-1 text-sm font-bold text-stone-900">{from} → {to}</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-stone-500">Category</p>
          <p className="mt-1 text-sm font-bold text-stone-900">{filterCategory || "All"}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-500">Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs outline-none"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-stone-400">No expenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-start">Date</th>
                  <th className="px-4 py-3 text-start">Category</th>
                  <th className="px-4 py-3 text-start">Description</th>
                  <th className="px-4 py-3 text-end">Amount</th>
                  <th className="px-4 py-3 text-start">Payment Method</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2.5 text-stone-800">{r.date}</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-block rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-600">
                        {r.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-stone-800">{r.description}</td>
                    <td className="px-4 py-2.5 text-end font-semibold text-stone-900">{fmt(r.amount)}</td>
                    <td className="px-4 py-2.5 text-stone-600">{r.payment_method}</td>
                    <td className="px-4 py-2.5 text-end">
                      <button
                        onClick={() => openEdit(r)}
                        className="mr-2 text-xs font-medium text-amber-600 hover:text-amber-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="text-xs font-medium text-red-500 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-amber-50">
                  <td className="px-4 py-2.5 font-bold text-stone-800" colSpan={3}>
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-end font-bold text-stone-900">{fmt(totalAmount)}</td>
                  <td className="px-4 py-2.5" colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">
                {editingId ? "Edit Expense" : "Add Expense"}
              </h2>
              <button onClick={closeForm} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setField("date", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-stone-500">Description</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setField("description", e.target.value)}
                  placeholder="What was this expense for?"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Amount (Rs.)</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={form.amount}
                  onChange={(e) => setField("amount", e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-500">Payment Method</label>
                <select
                  value={form.payment_method}
                  onChange={(e) => setField("payment_method", e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-stone-500">Notes (optional)</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  rows={2}
                  placeholder="Any additional notes..."
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={closeForm}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:border-amber-500 hover:text-amber-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : editingId ? "Update" : "Add Expense"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
