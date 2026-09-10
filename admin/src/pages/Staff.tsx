import { useCallback, useEffect, useState } from "react";
import { API, getToken } from "../lib/api";

interface StaffUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  active: boolean;
  created_at: string;
}

const ROLES = ["Owner", "Manager", "Salesman", "Accountant"];

const ROLE_COLORS: Record<string, string> = {
  Owner: "bg-amber-100 text-amber-800",
  Manager: "bg-stone-700 text-stone-100",
  Salesman: "bg-stone-200 text-stone-700",
  Accountant: "bg-blue-100 text-blue-800",
};

interface FormState {
  username: string;
  full_name: string;
  password: string;
  pin: string;
  role: string;
  active: boolean;
}

const blankForm: FormState = {
  username: "",
  full_name: "",
  password: "",
  pin: "",
  role: "Salesman",
  active: true,
};

export default function Staff() {
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const authHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/shop/users?shop_code=MAIN`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to load staff (${res.status})`);
      const data = await res.json();
      setUsers(data.users ?? data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        username: form.username,
        full_name: form.full_name,
        role: form.role,
        active: form.active,
        shop_code: "MAIN",
      };
      if (form.password) payload.password = form.password;
      if (form.pin) payload.pin = form.pin;

      const url = editingId
        ? `${API}/api/shop/users/${editingId}`
        : `${API}/api/shop/users`;
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Save failed (${res.status})`);
      }
      setShowForm(false);
      setEditingId(null);
      setForm(blankForm);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  };

  const remove = async (id: number) => {
    if (!window.confirm("Delete this user?")) return;
    setError(null);
    try {
      const res = await fetch(`${API}/api/shop/users/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const startEdit = (u: StaffUser) => {
    setForm({
      username: u.username,
      full_name: u.full_name,
      password: "",
      pin: "",
      role: u.role,
      active: u.active,
    });
    setEditingId(u.id);
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">
          Staff Management{" "}
          <span className="text-base font-normal text-stone-400">({users.length})</span>
        </h1>
        <button
          onClick={() => {
            setForm(blankForm);
            setEditingId(null);
            setShowForm(true);
          }}
          className="rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + Add Staff
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {showForm && (
        <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-bold text-stone-900">
            {editingId ? "Edit Staff Member" : "Add Staff Member"}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Username
              </label>
              <input
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Full Name
              </label>
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Password {editingId && "(leave blank to keep current)"}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                PIN (4-digit)
              </label>
              <input
                value={form.pin}
                maxLength={4}
                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "") })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
              >
                {ROLES.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <label className="flex items-center gap-2 text-sm text-stone-700">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500"
                />
                Active
              </label>
            </div>
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={save}
              disabled={!form.username || !form.full_name}
              className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
            >
              {editingId ? "Update" : "Create"}
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
              }}
              className="rounded-full border border-stone-300 px-5 py-2 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-stone-400">No staff members found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start">Username</th>
                <th className="px-4 py-3 text-start">Full Name</th>
                <th className="px-4 py-3 text-start">Role</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3 text-end">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-semibold text-stone-900">{u.username}</td>
                  <td className="px-4 py-2.5 text-stone-700">{u.full_name}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        ROLE_COLORS[u.role] ?? "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-end">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => startEdit(u)}
                        className="rounded-lg border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-700"
                      >
                        Edit
                      </button>
                      {(u.role === "Owner" || u.role === "Manager") && (
                        <button
                          onClick={() => remove(u.id)}
                          className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
