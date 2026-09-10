import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { downloadCsv, listProducts, mediaUrl } from "../lib/api";
import type { Product } from "../lib/types";

export default function Products() {
  const [rows, setRows] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [published, setPublished] = useState("");
  const [low, setLow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"table" | "grid">("table");

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    setLow(url.get("low") === "1");
  }, []);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await listProducts({ q, published, per_page: 100 });
        if (!alive) return;
        const rows = low ? res.data.filter((p) => Number(p.stock_qty) <= 5) : res.data;
        setRows(rows);
        setTotal(low ? rows.length : res.total);
        setError(null);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Load failed");
      } finally {
        if (alive) setLoading(false);
      }
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [q, published, low]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-stone-900">Products</h1>
          <p className="text-sm text-stone-500">{total} products in your catalog</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView(view === "table" ? "grid" : "table")}
            className="rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm font-medium text-stone-600 hover:border-amber-300 hover:text-amber-700"
          >
            {view === "table" ? "⊞ Grid" : "☰ Table"}
          </button>
          <button
            onClick={() => downloadCsv(`/api/shop/products/export${published ? `?published=${published}` : ""}`, `products-${new Date().toISOString().slice(0, 10)}.csv`).catch((e) => setError(e instanceof Error ? e.message : "Export failed"))}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-stone-600 hover:border-amber-300 hover:text-amber-700"
          >
            ⬇ Export
          </button>
          <Link
            to="/products/new"
            className="rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 px-5 py-2 text-sm font-bold text-white shadow-md shadow-amber-200 transition-all hover:shadow-lg hover:shadow-amber-300"
          >
            + New Product
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or SKU…"
            className="w-72 rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        <select
          value={published}
          onChange={(e) => setPublished(e.target.value)}
          className="rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm outline-none transition-colors focus:border-amber-500"
        >
          <option value="">All Status</option>
          <option value="1">Published</option>
          <option value="0">Draft</option>
        </select>
        <button
          onClick={() => setLow((v) => !v)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
            low
              ? "border-red-200 bg-red-50 text-red-600 shadow-sm"
              : "border-stone-200 bg-white text-stone-600 hover:border-stone-300"
          }`}
        >
          {low ? "⚠ Low Stock" : "Low Stock"}
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

      {/* Table View */}
      {view === "table" ? (
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
          {loading ? (
            <div className="grid h-48 place-items-center">
              <div className="flex items-center gap-3 text-stone-400">
                <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" /></svg>
                Loading…
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="grid h-48 place-items-center text-stone-400">No products found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-stone-100 bg-stone-50/80 text-start text-xs font-semibold uppercase tracking-wider text-stone-500">
                <tr>
                  <th className="px-5 py-3.5 text-start">Product</th>
                  <th className="px-5 py-3.5 text-start">SKU</th>
                  <th className="px-5 py-3.5 text-start">Metal</th>
                  <th className="px-5 py-3.5 text-start">Weight</th>
                  <th className="px-5 py-3.5 text-end">Price</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Website</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rows.map((p) => (
                  <tr key={p.sku} className="transition-colors hover:bg-amber-50/30">
                    <td className="px-5 py-3">
                      <Link to={`/products/${p.sku}`} className="flex items-center gap-3">
                        {p.media[0] ? (
                          <img src={mediaUrl(p.media[0])} alt="" className="h-10 w-10 rounded-xl object-cover shadow-sm" />
                        ) : (
                          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-stone-100 to-stone-50 text-stone-400">◆</span>
                        )}
                        <span className="font-semibold text-stone-900 hover:text-amber-700">{p.name}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-stone-500">{p.sku}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${p.metal_type === "gold" ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-600"}`}>
                        {p.metal_type === "gold" ? "🥇" : "🥈"} {p.metal_type}{p.karat ? ` ${p.karat}K` : ""}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-stone-600">{Number(p.net_weight).toFixed(3)}g</td>
                    <td className="px-5 py-3 text-end font-bold text-stone-900">Rs. {Number(p.sale_price).toLocaleString()}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.status === "In Stock" ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {p.published ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Live
                        </span>
                      ) : (
                        <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-500">Draft</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {loading ? (
            <div className="col-span-full grid h-48 place-items-center text-stone-400">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="col-span-full grid h-48 place-items-center text-stone-400">No products found.</div>
          ) : (
            rows.map((p) => (
              <Link
                key={p.sku}
                to={`/products/${p.sku}`}
                className="group overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all hover:shadow-md hover:shadow-amber-100"
              >
                <div className="aspect-square overflow-hidden bg-stone-100">
                  {p.media[0] ? (
                    <img src={mediaUrl(p.media[0])} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  ) : (
                    <div className="grid h-full w-full place-items-center text-stone-300">◆</div>
                  )}
                </div>
                <div className="p-3">
                  <p className="truncate text-sm font-semibold text-stone-900">{p.name}</p>
                  <p className="mt-0.5 text-xs text-stone-500">{p.sku}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-bold text-stone-900">Rs. {Number(p.sale_price).toLocaleString()}</span>
                    {p.published ? (
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-stone-300" />
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
