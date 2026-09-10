import { useCallback, useEffect, useMemo, useState } from "react";
import {
  downloadPosCsv,
  downloadPosPdf,
  getPosSales,
  getPosSummary,
  getPosTable,
} from "../lib/api";
import type { PosSalesReport, PosSummaryReport, PosTableReport } from "../lib/api";

type Tab = "overview" | "profitLoss" | "purchases" | "expenses" | "repairs" | "exchanges" | "customers" | "ledger" | "inventory" | "goldRates";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview", label: "Overview & Sales" },
  { key: "profitLoss", label: "Profit & Loss" },
  { key: "purchases", label: "Purchases" },
  { key: "expenses", label: "Expenses" },
  { key: "repairs", label: "Repairs" },
  { key: "exchanges", label: "Exchanges" },
  { key: "customers", label: "Customers" },
  { key: "ledger", label: "Ledger" },
  { key: "inventory", label: "Inventory" },
  { key: "goldRates", label: "Gold & Silver" },
];

const REPORT_ENDPOINT: Record<Tab, string | null> = {
  overview: null,
  profitLoss: "profit-loss",
  purchases: "purchases",
  expenses: "expenses",
  repairs: "repairs",
  exchanges: "exchanges",
  customers: "customers",
  ledger: "ledger",
  inventory: "inventory",
  goldRates: "gold-rates",
};

const PERIODS = [
  { label: "This Month", days: 0 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "This Year", days: 365 },
  { label: "All time", days: 3650 },
];

const today = () => new Date().toISOString().slice(0, 10);
const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);

const fmt = (n: number) =>
  "Rs. " + n.toLocaleString("en-PK", { maximumFractionDigits: 2 });

export default function PosReports() {
  const [tab, setTab] = useState<Tab>("overview");
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(today());
  const [periodIdx, setPeriodIdx] = useState(1);
  const [summary, setSummary] = useState<PosSummaryReport | null>(null);
  const [sales, setSales] = useState<PosSalesReport | null>(null);
  const [table, setTable] = useState<PosTableReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyPeriod = (idx: number) => {
    setPeriodIdx(idx);
    const days = PERIODS[idx].days;
    setFrom(days === 0 ? new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10) : daysAgo(days));
    setTo(today());
  };

  const endpoint = REPORT_ENDPOINT[tab];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, sl] = await Promise.all([getPosSummary(from, to), getPosSales("month", from, to)]);
      setSummary(s);
      setSales(sl);
      if (tab === "overview") {
        setTable(null);
      } else if (endpoint) {
        setTable(await getPosTable(endpoint, from, to));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [from, to, tab, endpoint]);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    if (!summary) return [];
    return [
      { label: "POS Sales", value: fmt(summary.sales_total), sub: `${summary.sales_count} invoices · avg ${fmt(summary.avg_sale)}` },
      { label: "Purchases", value: fmt(summary.purchases_total) },
      { label: "Expenses", value: fmt(summary.expenses_total) },
      { label: "Payments Received", value: fmt(summary.payments_received) },
      { label: "Receivables", value: fmt(summary.receivables), sub: `${summary.repairs_pending} repairs pending` },
      { label: "Inventory Value", value: fmt(summary.inventory_value), sub: `${summary.low_stock_count} low stock` },
      { label: "Gold Stock", value: `${summary.gold_weight.toLocaleString()} g`, sub: "net weight" },
      { label: "Silver Stock", value: `${summary.silver_weight.toLocaleString()} g`, sub: "net weight" },
    ];
  }, [summary]);

  const maxRevenue = Math.max(1, ...(sales?.series.map((s) => s.revenue) ?? [1]));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Reports</h1>
          <p className="mt-1 text-sm text-stone-500">
            Business data synced from the desktop POS ·{" "}
            <span className="font-medium text-stone-700">{from} → {to}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={periodIdx}
            onChange={(e) => applyPeriod(Number(e.target.value))}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs outline-none"
          >
            {PERIODS.map((p, i) => (
              <option key={p.label} value={i}>{p.label}</option>
            ))}
          </select>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs outline-none" />
          <span className="text-xs text-stone-400">→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
            className="rounded-lg border border-stone-300 px-2 py-1.5 text-xs outline-none" />
        </div>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              tab === t.key
                ? "bg-amber-600 text-white"
                : "border border-stone-300 text-stone-600 hover:border-amber-500 hover:text-amber-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {loading ? (
          <p className="p-8 text-stone-400">Loading…</p>
        ) : tab === "overview" && summary ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {kpis.map((k) => (
                <div key={k.label} className="rounded-2xl border border-stone-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-stone-500">{k.label}</p>
                  <p className="mt-1 text-lg font-bold text-stone-900">{k.value}</p>
                  {k.sub && <p className="mt-1 text-xs text-stone-400">{k.sub}</p>}
                </div>
              ))}
            </div>

            {sales && (
              <div className="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-stone-800">
                    Monthly Sales — {from} to {to}
                  </h2>
                  <div className="flex gap-1.5 text-xs">
                    <button
                      onClick={() => downloadPosPdf("sales", from, to, { period: "month" })}
                      className="rounded-full border border-stone-300 px-3 py-1 font-semibold text-stone-600 hover:border-amber-500 hover:text-amber-700"
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => downloadPosCsv("sales", from, to, { period: "month" })}
                      className="rounded-full border border-stone-300 px-3 py-1 font-semibold text-stone-600 hover:border-amber-500 hover:text-amber-700"
                    >
                      CSV
                    </button>
                  </div>
                </div>
                <div className="flex h-40 items-end gap-1">
                  {sales.series.map((s) => (
                    <div key={s.label} className="group relative flex-1" title={`${s.label}: ${fmt(s.revenue)}`}>
                      <div
                        className="w-full rounded-t bg-gradient-to-t from-amber-600 to-amber-400"
                        style={{ height: `${Math.max(2, (s.revenue / maxRevenue) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-stone-500">
                  {sales.total_orders} invoices · {fmt(sales.total_revenue)} total
                </p>
              </div>
            )}
          </>
        ) : table ? (
          <ReportTable table={table} endpoint={endpoint!} />
        ) : (
          <p className="p-8 text-stone-400">No data.</p>
        )}
      </div>
    </div>
  );
}

function ReportTable({ table, endpoint }: { table: PosTableReport; endpoint: string }) {
  const exportReport = async (format: "pdf" | "csv") => {
    if (format === "pdf") await downloadPosPdf(endpoint, table.from, table.to);
    else await downloadPosCsv(endpoint, table.from, table.to);
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
        <div>
          <h2 className="text-sm font-bold text-stone-800">{table.title}</h2>
          <p className="text-xs text-stone-500">{table.from} → {table.to}</p>
        </div>
        <div className="flex gap-1.5 text-xs">
          <button
            onClick={() => exportReport("pdf")}
            className="rounded-full border border-stone-300 px-3 py-1 font-semibold text-stone-600 hover:border-amber-500 hover:text-amber-700"
          >
            Export PDF
          </button>
          <button
            onClick={() => exportReport("csv")}
            className="rounded-full border border-stone-300 px-3 py-1 font-semibold text-stone-600 hover:border-amber-500 hover:text-amber-700"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
            <tr>
              {table.headings.map((h, i) => (
                <th key={i} className={`px-4 py-3 ${i > 0 ? "text-end" : "text-start"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {table.rows.length === 0 ? (
              <tr><td colSpan={table.headings.length} className="p-6 text-center text-stone-400">
                No records in this period{Object.keys(table.totals).length ? "" : "."}
                {Object.entries(table.totals).map(([k, v]) => (
                  <span key={k} className="mt-1 block font-medium text-stone-600">{k}: {v}</span>
                ))}
              </td></tr>
            ) : (
              <>
                {table.rows.map((r, ri) => (
                  <tr key={ri} className="hover:bg-stone-50">
                    {r.map((c, ci) => (
                      <td key={ci} className={`px-4 py-2.5 ${ci > 0 ? "text-end" : "text-start"} ${ci === 0 ? "font-medium text-stone-800" : "text-stone-600"}`}>
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
                {Object.entries(table.totals).length > 0 && (
                  <tr className="bg-amber-50">
                    <td className="px-4 py-2.5 font-bold text-stone-800" colSpan={table.headings.length}>
                      {Object.entries(table.totals).map(([k, v]) => (
                        <span key={k} className="mr-6">{k}: <span className="font-bold">{v}</span></span>
                      ))}
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}