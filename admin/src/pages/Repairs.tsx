import { useCallback, useEffect, useState } from "react";
import { API, getToken } from "../lib/api";

interface Repair {
  id: number;
  customer_name: string;
  product_name: string;
  problem: string;
  status: string;
  received_date: string;
  expected_date: string | null;
  estimated_charges: number | null;
  final_charges: number | null;
  employee: string | null;
  notes: string | null;
  created_at: string;
}

const STATUSES = ["Received", "Inspection", "In Repair", "Ready", "Delivered"];

const STATUS_COLORS: Record<string, string> = {
  Received: "bg-blue-100 text-blue-700",
  Inspection: "bg-yellow-100 text-yellow-700",
  "In Repair": "bg-orange-100 text-orange-700",
  Ready: "bg-green-100 text-green-700",
  Delivered: "bg-stone-100 text-stone-500",
};

const EMPTY_FORM = {
  customer_name: "",
  product_name: "",
  problem: "",
  estimated_charges: "",
  final_charges: "",
  employee: "",
  status: "Received",
  notes: "",
  expected_date: "",
};

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
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

export default function Repairs() {
  const [rows, setRows] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<{ repairs: Repair[] }>("/api/shop/repairs?shop_code=MAIN");
      setRows(data.repairs);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = filter ? rows.filter((r) => r.status === filter) : rows;

  const openAdd = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (r: Repair) => {
    setEditId(r.id);
    setForm({
      customer_name: r.customer_name,
      product_name: r.product_name,
      problem: r.problem,
      estimated_charges: r.estimated_charges != null ? String(r.estimated_charges) : "",
      final_charges: r.final_charges != null ? String(r.final_charges) : "",
      employee: r.employee ?? "",
      status: r.status,
      notes: r.notes ?? "",
      expected_date: r.expected_date ?? "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        shop_code: "MAIN",
        estimated_charges: form.estimated_charges ? Number(form.estimated_charges) : null,
        final_charges: form.final_charges ? Number(form.final_charges) : null,
        expected_date: form.expected_date || null,
      };

      if (editId) {
        await api(`/api/shop/repairs/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/shop/repairs", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this repair?")) return;
    setError(null);
    try {
      await api(`/api/shop/repairs/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">
          Repairs <span className="text-base font-normal text-stone-400">({rows.length})</span>
        </h1>
        <button
          onClick={openAdd}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
        >
          + New Repair
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("")}
          className={`rounded-lg px-3 py-1 text-xs font-medium ${
            filter === "" ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
          }`}
        >
          All ({rows.length})
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-lg px-3 py-1 text-xs font-medium ${
              filter === s ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {s} ({rows.filter((r) => r.status === s).length})
          </button>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2 className="mb-4 text-lg font-bold text-stone-900">
              {editId ? "Edit Repair" : "New Repair"}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <label className="col-span-2 block text-sm font-medium text-stone-700">
                Customer Name *
                <input
                  required
                  value={form.customer_name}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Product *
                <input
                  required
                  value={form.product_name}
                  onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Status
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 block text-sm font-medium text-stone-700">
                Problem *
                <textarea
                  required
                  rows={2}
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Estimated Charges
                <input
                  type="number"
                  value={form.estimated_charges}
                  onChange={(e) => setForm({ ...form, estimated_charges: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Final Charges
                <input
                  type="number"
                  value={form.final_charges}
                  onChange={(e) => setForm({ ...form, final_charges: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Employee
                <input
                  value={form.employee}
                  onChange={(e) => setForm({ ...form, employee: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </label>
              <label className="block text-sm font-medium text-stone-700">
                Expected Date
                <input
                  type="date"
                  value={form.expected_date}
                  onChange={(e) => setForm({ ...form, expected_date: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </label>
              <label className="col-span-2 block text-sm font-medium text-stone-700">
                Notes
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : editId ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-stone-400">No repairs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
                <tr>
                  <th className="px-4 py-3 text-start">ID</th>
                  <th className="px-4 py-3 text-start">Customer</th>
                  <th className="px-4 py-3 text-start">Product</th>
                  <th className="px-4 py-3 text-start">Problem</th>
                  <th className="px-4 py-3 text-start">Status</th>
                  <th className="px-4 py-3 text-start">Received</th>
                  <th className="px-4 py-3 text-start">Expected</th>
                  <th className="px-4 py-3 text-end">Est. Charges</th>
                  <th className="px-4 py-3 text-end">Final Charges</th>
                  <th className="px-4 py-3 text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-stone-50">
                    <td className="px-4 py-2.5 text-stone-500">#{r.id}</td>
                    <td className="px-4 py-2.5 font-semibold text-stone-900">{r.customer_name}</td>
                    <td className="px-4 py-2.5 text-stone-600">{r.product_name}</td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-stone-600" title={r.problem}>
                      {r.problem}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-stone-100 text-stone-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-stone-500">
                      {r.received_date ? new Date(r.received_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-stone-500">
                      {r.expected_date ? new Date(r.expected_date).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-end text-stone-700">
                      {r.estimated_charges != null ? `Rs. ${Number(r.estimated_charges).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-end font-medium text-stone-900">
                      {r.final_charges != null ? `Rs. ${Number(r.final_charges).toLocaleString()}` : "—"}
                    </td>
                    <td className="px-4 py-2.5 text-end">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(r)}
                          className="rounded-lg border border-stone-200 px-2.5 py-1 text-xs text-stone-600 hover:bg-stone-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
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
