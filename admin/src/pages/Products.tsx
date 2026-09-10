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
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [q, published, low]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">
          Products{" "}
          <span className="text-base font-normal text-stone-400">({total})</span>
        </h1>
        <Link
          to="/products/new"
          className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + New Product
        </Link>
        <button
          onClick={() =>
            downloadCsv(
              `/api/shop/products/export${published ? `?published=${published}` : ""}`,
              `products-${new Date().toISOString().slice(0, 10)}.csv`
            ).catch((e) => setError(e instanceof Error ? e.message : "Export failed"))
          }
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-700"
        >
          ⬇ Export CSV
        </button>
      </div>

      <div className="mt-5 flex gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name or SKU…"
          className="w-72 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600"
        />
        <select
          value={published}
          onChange={(e) => setPublished(e.target.value)}
          className="rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none"
        >
          <option value="">All</option>
          <option value="1">Published</option>
          <option value="0">Unpublished</option>
        </select>
        <button
          onClick={() => setLow((v) => !v)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium ${
            low
              ? "border-red-200 bg-red-50 text-red-600"
              : "border-stone-300 bg-white text-stone-600 hover:border-stone-400"
          }`}
        >
          ≤ 5 stock
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-stone-400">No products found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start">Product</th>
                <th className="px-4 py-3 text-start">SKU</th>
                <th className="px-4 py-3 text-start">Metal</th>
                <th className="px-4 py-3 text-start">Weight (g)</th>
                <th className="px-4 py-3 text-end">Price</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Website</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((p) => (
                <tr key={p.sku} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5">
                    <Link
                      to={`/products/${p.sku}`}
                      className="flex items-center gap-3"
                    >
                      {p.media[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(p.media[0])}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-stone-100 text-stone-400">
                          ◆
                        </span>
                      )}
                      <span className="font-semibold text-stone-900 hover:text-amber-700">
                        {p.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-stone-500">{p.sku}</td>
                  <td className="px-4 py-2.5 capitalize text-stone-600">
                    {p.metal_type}
                    {p.karat ? ` ${p.karat}K` : ""}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">
                    {Number(p.net_weight).toFixed(3)}
                  </td>
                  <td className="px-4 py-2.5 text-end font-semibold text-stone-900">
                    Rs. {Number(p.sale_price).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-center text-stone-600">
                    {p.status}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {p.published ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Live
                      </span>
                    ) : (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-semibold text-stone-500">
                        Draft
                      </span>
                    )}
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