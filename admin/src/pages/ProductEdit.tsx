import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getProduct, mediaUrl, upsertProduct, uploadMedia } from "../lib/api";

interface FormState {
  sku: string;
  name: string;
  category: string;
  metal_type: "gold" | "silver";
  karat: number | null;
  net_weight: string;
  gross_weight: string;
  stone_weight: string;
  making_charges: string;
  stone_charges: string;
  sale_price: string;
  purchase_cost: string;
  stock_qty: string;
  status: string;
  published: boolean;
  featured: boolean;
  new_arrival: boolean;
  best_seller: boolean;
  description: string;
}

const empty: FormState = {
  sku: "",
  name: "",
  category: "",
  metal_type: "gold",
  karat: 22,
  net_weight: "",
  gross_weight: "",
  stone_weight: "",
  making_charges: "",
  stone_charges: "",
  sale_price: "",
  purchase_cost: "",
  stock_qty: "1",
  status: "In Stock",
  published: false,
  featured: false,
  new_arrival: false,
  best_seller: false,
  description: "",
};

export default function ProductEdit() {
  const { sku } = useParams();
  const isNew = sku === "new";
  const nav = useNavigate();
  const [form, setForm] = useState<FormState>(empty);
  const [media, setMedia] = useState<{ path: string; url?: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    const params = sku ?? "";
    getProduct(params)
      .then((p) => {
        setForm({
          sku: p.sku,
          name: p.name,
          category: p.category?.name ?? "",
          metal_type: p.metal_type,
          karat: p.karat,
          net_weight: String(p.net_weight ?? ""),
          gross_weight: String(p.gross_weight ?? ""),
          stone_weight: String(p.stone_weight ?? ""),
          making_charges: String(p.making_charges ?? ""),
          stone_charges: String(p.stone_charges ?? ""),
          sale_price: String(p.sale_price ?? ""),
          purchase_cost: String(p.purchase_cost ?? ""),
          stock_qty: String(p.stock_qty),
          status: p.status,
          published: p.published,
          featured: p.featured,
          new_arrival: p.new_arrival,
          best_seller: p.best_seller,
          description: p.description ?? "",
        });
        setMedia(p.media ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Load failed"));
  }, [sku, isNew]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const num = (s: string) => (s === "" ? null : Number(s));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.sku.trim() || !form.name.trim()) {
      setError("SKU and name are required");
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const payload: Record<string, unknown> = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        category: form.category.trim() || null,
        metal_type: form.metal_type,
        karat: num(String(form.karat)),
        net_weight: num(form.net_weight) ?? 0,
        gross_weight: num(form.gross_weight) ?? 0,
        stone_weight: num(form.stone_weight) ?? 0,
        making_charges: num(form.making_charges) ?? 0,
        stone_charges: num(form.stone_charges) ?? 0,
        sale_price: num(form.sale_price) ?? 0,
        purchase_cost: num(form.purchase_cost) ?? 0,
        stock_qty: num(form.stock_qty) ?? 1,
        status: form.status,
        published: form.published,
        featured: form.featured,
        new_arrival: form.new_arrival,
        best_seller: form.best_seller,
        description: form.description.trim() || null,
      };
      await upsertProduct(payload);
      setMsg("Saved.");
      if (isNew) nav(`/products/${encodeURIComponent(form.sku.trim())}`, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isNew) {
      if (isNew && file) setError("Save the product first, then upload photos.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await uploadMedia(sku ?? "", file);
      const p = await getProduct(sku ?? "");
      setMedia(p.media ?? []);
      setMsg("Photo uploaded.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const input =
    "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600";
  const toggles: { key: keyof FormState; label: string }[] = [
    { key: "published", label: "Publish on website" },
    { key: "featured", label: "Featured" },
    { key: "new_arrival", label: "New arrival" },
    { key: "best_seller", label: "Best seller" },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-stone-900">
        {isNew ? "New Product" : `Edit ${sku}`}
      </h1>

      <form onSubmit={submit} className="mt-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              SKU
            </label>
            <input
              className={input}
              value={form.sku}
              onChange={(e) => set("sku", e.target.value)}
              disabled={!isNew}
              placeholder="JWL-RING-001"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Name
            </label>
            <input className={input} value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Category
            </label>
            <input className={input} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Rings" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Metal
            </label>
            <select className={input} value={form.metal_type} onChange={(e) => set("metal_type", e.target.value as "gold" | "silver")}>
              <option value="gold">Gold</option>
              <option value="silver">Silver</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Karat
            </label>
            <select className={input} value={form.karat ?? ""} onChange={(e) => set("karat", e.target.value === "" ? null : Number(e.target.value))}>
              <option value="">—</option>
              {[24, 22, 21, 20, 18].map((k) => (
                <option key={k} value={k}>{k}K</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Net Weight (g)
            </label>
            <input className={input} value={form.net_weight} onChange={(e) => set("net_weight", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Gross Weight (g)
            </label>
            <input className={input} value={form.gross_weight} onChange={(e) => set("gross_weight", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Stone Weight (g)
            </label>
            <input className={input} value={form.stone_weight} onChange={(e) => set("stone_weight", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Making Charges
            </label>
            <input className={input} value={form.making_charges} onChange={(e) => set("making_charges", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Stone Charges
            </label>
            <input className={input} value={form.stone_charges} onChange={(e) => set("stone_charges", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Stock Qty
            </label>
            <input className={input} value={form.stock_qty} onChange={(e) => set("stock_qty", e.target.value)} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Sale Price
            </label>
            <input className={input} value={form.sale_price} onChange={(e) => set("sale_price", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Purchase Cost
            </label>
            <input className={input} value={form.purchase_cost} onChange={(e) => set("purchase_cost", e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
              Status
            </label>
            <select className={input} value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option>In Stock</option>
              <option>On Order</option>
              <option>Out of Stock</option>
              <option>Reserved</option>
              <option>Sold</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Description
          </label>
          <textarea rows={3} className={input} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {toggles.map((tog) => (
            <label key={tog.key} className="flex items-center gap-3 rounded-xl border border-stone-200 p-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={form[tog.key] as boolean}
                onChange={(e) => set(tog.key, e.target.checked) as unknown as void}
                className="h-4 w-4 accent-amber-600"
              />
              {tog.label}
            </label>
          ))}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {msg && <p className="text-sm text-green-700">{msg}</p>}

        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-amber-600 px-7 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save Product"}
        </button>
      </form>

      {!isNew && (
        <section className="mt-10 border-t border-stone-200 pt-6">
          <h2 className="text-lg font-bold text-stone-900">Photos</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {media.map((m) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.path} src={mediaUrl(m)} alt="" className="h-24 w-24 rounded-xl object-cover" />
            ))}
          </div>
          <label className="mt-4 inline-block cursor-pointer rounded-full border border-stone-300 px-5 py-2 text-sm font-semibold text-stone-700 hover:border-amber-600">
            Upload photo
            <input type="file" accept="image/*" className="hidden" onChange={onFile} />
          </label>
        </section>
      )}
    </div>
  );
}