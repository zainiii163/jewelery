import { useCallback, useEffect, useState } from "react";

interface Category {
  id: number;
  name: string;
  slug: string;
  parent_id: number | null;
  products_count: number;
  children?: Category[];
}

const api = (path: string, init?: RequestInit) => {
  const token = localStorage.getItem("jw_admin_token");
  return fetch(`${(import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  }).then(async (r) => {
    if (r.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `Failed (${r.status})`); }
    return r.json();
  });
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/shop/categories");
      setCategories(res.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = (parentId?: number) => {
    setEditingId(null);
    setName("");
    setParentId(parentId ?? null);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setName(cat.name);
    setParentId(cat.parent_id);
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await api(`/api/shop/categories/${editingId}`, { method: "PUT", body: JSON.stringify({ name, parent_id: parentId }) });
      } else {
        await api("/api/shop/categories", { method: "POST", body: JSON.stringify({ name, parent_id: parentId }) });
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    try {
      await api(`/api/shop/categories/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const parents = categories.filter((c) => !c.parent_id);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
        <div className="flex gap-2">
          <button onClick={() => openNew()} className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700">
            + New Category
          </button>
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-stone-400">Loading...</p>
      ) : (
        <div className="mt-5 space-y-3">
          {parents.map((cat) => (
            <div key={cat.id} className="rounded-2xl border border-stone-200 bg-white">
              <div className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="font-semibold text-stone-900">{cat.name}</p>
                  <p className="text-xs text-stone-400">{cat.products_count ?? 0} products &middot; {cat.children?.length ?? 0} subcategories</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openNew(cat.id)} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-600 hover:border-amber-500">
                    + Sub
                  </button>
                  <button onClick={() => openEdit(cat)} className="rounded-full border border-stone-300 px-3 py-1 text-xs font-semibold text-stone-600 hover:border-amber-500">
                    Edit
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-500 hover:border-red-400">
                    Delete
                  </button>
                </div>
              </div>
              {cat.children && cat.children.length > 0 && (
                <div className="border-t border-stone-100 bg-stone-50 px-5 py-2">
                  {cat.children.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-stone-700">{sub.name} <span className="text-xs text-stone-400">({sub.products_count ?? 0})</span></span>
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(sub)} className="text-xs text-stone-500 hover:text-amber-600">Edit</button>
                        <button onClick={() => handleDelete(sub.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {categories.length === 0 && <p className="text-stone-400">No categories yet.</p>}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-stone-900">{editingId ? "Edit Category" : "New Category"}</h2>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Name *</label>
                <input value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Parent Category</label>
                <select value={parentId ?? ""} onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : null)} className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600">
                  <option value="">None (top-level)</option>
                  {parents.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
