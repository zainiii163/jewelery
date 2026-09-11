import { useCallback, useEffect, useRef, useState } from "react";

interface SaleRecord {
  id: number;
  invoice_no: string;
  customer_name: string | null;
  customer_phone: string | null;
  sale_date: string;
  sale_price: number;
  discount: number;
  final_price: number;
  amount_paid: number;
  amount_remaining: number;
  payment_method: string | null;
  notes: string | null;
  photos: string[] | null;
  product?: { sku: string; name: string } | null;
}

interface Product { id: number; sku: string; name: string; sale_price: number; stock_qty: number; }

const API = (import.meta.env.VITE_API_URL || "https://jewelery-production-f514.up.railway.app").replace(/\/$/, "");

const api = (path: string, init?: RequestInit) => {
  const token = localStorage.getItem("jw_admin_token");
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  }).then(async (r) => {
    if (r.status === 401) { window.location.href = "/login"; throw new Error("Unauthorized"); }
    if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.message || `Failed (${r.status})`); }
    return r.json();
  });
};

const rupee = (n: number) => `Rs. ${Number(n).toLocaleString()}`;

export default function SalesRecords() {
  const [records, setRecords] = useState<SaleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    product_id: "",
    customer_name: "",
    customer_phone: "",
    sale_date: new Date().toISOString().split("T")[0],
    sale_price: "",
    discount: "0",
    amount_paid: "",
    payment_method: "Cash",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api("/api/shop/sale-records");
      setRecords(res.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openNew = async () => {
    setForm({ product_id: "", customer_name: "", customer_phone: "", sale_date: new Date().toISOString().split("T")[0], sale_price: "", discount: "0", amount_paid: "", payment_method: "Cash", notes: "" });
    setPhotos([]);
    setPhotoPreview([]);
    setError(null);
    setModalOpen(true);
    try {
      const res = await api("/api/shop/products?per_page=200");
      setProducts(res.data ?? []);
    } catch { /* ignore */ }
  };

  const onPhotos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setPhotos((p) => [...p, ...files]);
    files.forEach((f) => {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview((p) => [...p, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removePhoto = (idx: number) => {
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setPhotoPreview((p) => p.filter((_, i) => i !== idx));
  };

  const selectProduct = (id: string) => {
    const p = products.find((x) => x.id === Number(id));
    setForm((f) => ({ ...f, product_id: id, sale_price: p ? String(p.sale_price) : f.sale_price }));
  };

  const handleSave = async () => {
    if (!form.sale_date || !form.sale_price) { setError("Date and price are required"); return; }
    setSaving(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("sale_date", form.sale_date);
      fd.append("sale_price", form.sale_price);
      fd.append("discount", form.discount || "0");
      fd.append("amount_paid", form.amount_paid || String(Number(form.sale_price) - Number(form.discount || 0)));
      fd.append("payment_method", form.payment_method);
      if (form.product_id) fd.append("product_id", form.product_id);
      if (form.customer_name) fd.append("customer_name", form.customer_name);
      if (form.customer_phone) fd.append("customer_phone", form.customer_phone);
      if (form.notes) fd.append("notes", form.notes);
      photos.forEach((p) => fd.append("photos[]", p));

      await api("/api/shop/sale-records", { method: "POST", body: fd, headers: {} });
      setModalOpen(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const finalPrice = Number(form.sale_price || 0) - Number(form.discount || 0);
  const input = "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Sales Records</h1>
        <button onClick={openNew} className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700">
          + Record Sale
        </button>
      </div>

      {loading ? <p className="mt-6 text-stone-400">Loading...</p> : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start">Invoice</th>
                <th className="px-4 py-3 text-start">Date</th>
                <th className="px-4 py-3 text-start">Customer</th>
                <th className="px-4 py-3 text-start">Product</th>
                <th className="px-4 py-3 text-end">Price</th>
                <th className="px-4 py-3 text-end">Paid</th>
                <th className="px-4 py-3 text-end">Remaining</th>
                <th className="px-4 py-3 text-center">Photos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-mono text-xs font-medium text-stone-800">{r.invoice_no}</td>
                  <td className="px-4 py-2.5 text-stone-600">{new Date(r.sale_date).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5">{r.customer_name ?? "Walk-in"}</td>
                  <td className="px-4 py-2.5 text-stone-600">{r.product?.name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-end font-semibold">{rupee(r.final_price)}</td>
                  <td className="px-4 py-2.5 text-end text-green-700">{rupee(r.amount_paid)}</td>
                  <td className={`px-4 py-2.5 text-end font-medium ${r.amount_remaining > 0 ? "text-red-600" : "text-stone-500"}`}>{rupee(r.amount_remaining)}</td>
                  <td className="px-4 py-2.5 text-center">{r.photos?.length ?? 0}</td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={8} className="px-4 py-8 text-center text-stone-400">No sales recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setModalOpen(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-stone-900">Record Sale</h2>
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-stone-600">Product</label>
                <select value={form.product_id} onChange={(e) => selectProduct(e.target.value)} className={input}>
                  <option value="">Walk-in / No product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.sku}) - Stock: {p.stock_qty}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Customer Name</label>
                <input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Phone</label>
                <input value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Sale Date *</label>
                <input type="date" value={form.sale_date} onChange={(e) => setForm({ ...form, sale_date: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Payment Method</label>
                <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} className={input}>
                  <option>Cash</option><option>Card</option><option>Bank</option><option>JazzCash</option><option>Easypaisa</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Sale Price *</label>
                <input type="number" value={form.sale_price} onChange={(e) => setForm({ ...form, sale_price: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Discount</label>
                <input type="number" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Amount Paid</label>
                <input type="number" value={form.amount_paid} onChange={(e) => setForm({ ...form, amount_paid: e.target.value })} placeholder={String(finalPrice)} className={input} />
              </div>
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
                <p className="text-xs text-stone-500">Final Price</p>
                <p className="text-lg font-bold text-stone-900">{rupee(finalPrice)}</p>
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-stone-600">Notes</label>
                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={input} />
              </div>

              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-stone-600">Sale Photos</label>
                <div className="flex flex-wrap gap-2">
                  {photoPreview.map((src, i) => (
                    <div key={i} className="relative h-20 w-20">
                      <img src={src} alt="" className="h-full w-full rounded-lg object-cover" />
                      <button onClick={() => removePhoto(i)} className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-[10px] text-white">x</button>
                    </div>
                  ))}
                  <button onClick={() => fileRef.current?.click()} className="flex h-20 w-20 items-center justify-center rounded-lg border-2 border-dashed border-stone-300 text-2xl text-stone-400 hover:border-amber-500">+</button>
                </div>
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onPhotos} />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
                {saving ? "Saving..." : "Record Sale"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
