import { Fragment, useCallback, useEffect, useState } from "react";
import WhatsAppButton from "../components/WhatsAppButton";
import { downloadCsv, listOrders, updateOrder } from "../lib/api";
import type { OnlineOrder } from "../lib/types";

const rupee = (n: number) => `Rs. ${Number(n).toLocaleString()}`;

const orderWaText = (o: OnlineOrder) => {
  const lines = o.items
    .map((i) => `• ${i.product_name} × ${i.qty} — ${rupee(i.line_total)}`)
    .join("\n");
  return [
    `Salam ${o.customer_name}! This is Tayyab Jewellers regarding your order ${o.order_number}.`,
    lines,
    `Total: ${rupee(o.total)}`,
    `Status: ${o.status} | Payment: ${o.payment_status.toUpperCase()}`,
    o.notes ? `Note: ${o.notes}` : "",
    "Please feel free to reply here. Thank you!",
  ]
    .filter(Boolean)
    .join("\n");
};

const ORDER_STATUSES = ["Pending", "Confirmed", "In Progress", "Ready", "Completed", "Cancelled"];

export default function Orders() {
  const [rows, setRows] = useState<OnlineOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listOrders());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: number, key: "status" | "payment_status", value: string) => {
    try {
      await updateOrder(id, key === "status" ? { status: value } : { payment_status: value as "paid" | "pending" | "failed" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  const exportCsv = async () => {
    try {
      await downloadCsv("/api/shop/orders/export", `orders-${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">
          Online Orders <span className="text-base font-normal text-stone-400">({rows.length})</span>
        </h1>
        <button
          onClick={exportCsv}
          className="rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:border-amber-500 hover:text-amber-700"
        >
          ⬇ Export CSV
        </button>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-stone-400">No online orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start">Order</th>
                <th className="px-4 py-3 text-start">Customer</th>
                <th className="px-4 py-3 text-end">Total</th>
                <th className="px-4 py-3 text-start">Payment</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3 text-start">Placed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((o) => (
                <Fragment key={o.id}>
                  <tr
                    className="cursor-pointer hover:bg-stone-50"
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  >
                    <td className="px-4 py-2.5 font-semibold text-stone-900">{o.order_number}</td>
                    <td className="px-4 py-2.5">
                      <p className="font-medium text-stone-800">{o.customer_name}</p>
                      <p className="text-xs text-stone-500">{o.customer_phone ?? o.customer_email ?? ""}</p>
                    </td>
                    <td className="px-4 py-2.5 text-end font-semibold">
                      Rs. {Number(o.total).toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={o.payment_status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => patch(o.id, "payment_status", e.target.value)}
                        className="rounded-lg border border-stone-300 px-2 py-1 text-xs outline-none"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>
                    <td className="px-4 py-2.5">
                      <select
                        value={o.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => patch(o.id, "status", e.target.value)}
                        className="rounded-lg border border-stone-300 px-2 py-1 text-xs outline-none"
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-stone-500">
                      {new Date(o.created_at).toLocaleString()}
                    </td>
                  </tr>
                  {expanded === o.id && (
                    <tr key={`${o.id}-items`}>
                      <td colSpan={6} className="bg-stone-50 px-6 py-4">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
                          Items
                        </p>
                        <div className="max-w-xl space-y-1 text-sm">
                          {o.items.map((i) => (
                            <div key={i.id} className="flex justify-between gap-4">
                              <span className="truncate">
                                {i.product_name} <span className="text-stone-400">({i.product_sku}) × {i.qty}</span>
                              </span>
                              <span className="font-medium">Rs. {Number(i.line_total).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                        {o.notes && (
                          <p className="mt-3 text-sm text-stone-600">Notes: {o.notes}</p>
                        )}
                        {o.address && (
                          <p className="mt-1 text-sm text-stone-600">
                            {[o.city, o.address].filter(Boolean).join(", ")}
                          </p>
                        )}
                        <div className="mt-4">
                          <WhatsAppButton phone={o.customer_phone} text={orderWaText(o)} label="WhatsApp customer" />
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}