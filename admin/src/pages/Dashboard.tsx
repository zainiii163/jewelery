import { useEffect, useMemo, useState } from "react";
import {
  getLowStock,
  getPaymentMethods,
  getReportSummary,
  getSalesReport,
  getStatusBreakdown,
  getTopProducts,
  type Bucket,
  type SalesPoint,
  type SummaryReport,
  type TopItem,
} from "../lib/api";
import type { Product } from "../lib/types";

const fmtRs = (n: number) =>
  "Rs " + n.toLocaleString("en-PK", { maximumFractionDigits: 0 });

function Kpi({ label, value, sub, tone = "default" }: {
  label: string;
  value: string;
  sub?: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneCls =
    tone === "good"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : "text-stone-900";
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-2 text-2xl font-black ${toneCls}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-400">{sub}</p>}
    </div>
  );
}

function RevenueChart({ series }: { series: SalesPoint[] }) {
  const max = Math.max(...series.map((s) => s.revenue), 1);
  const W = 720;
  const H = 220;
  const barW = Math.max(3, (W - 20) / Math.max(series.length, 1) - 2);
  const fmt = (v: number) =>
    v >= 100000 ? (v / 100000).toFixed(1) + "L" : v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-stone-900">Revenue — last 30 days</h2>
      </div>
      {series.length === 0 ||
        (max === 1 && series.every((s) => s.revenue === 0) && (
          <p className="mt-8 text-sm text-stone-400">No sales yet. Orders placed on the website appear here.</p>
        ))}
      {max > 1 && (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[560px]">
            <svg viewBox={`0 0 ${W} ${H + 26}`} className="block" role="img" aria-label="Revenue chart">
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <g key={f}>
                  <line x1={8} y1={H - f * H} x2={W - 8} y2={H - f * H} stroke="#e7e5e4" strokeWidth={1} />
                  <text x={W - 8} y={H - f * H - 4} textAnchor="end" className="fill-stone-400" fontSize={11}>
                    {fmt(max * f)}
                  </text>
                </g>
              ))}
              {series.map((s, i) => {
                const h = (s.revenue / max) * H;
                const x = 8 + i * (barW + 2) + (barW - Math.min(barW, 22)) / 2;
                return (
                  <rect
                    key={s.date}
                    x={x}
                    y={H - h}
                    width={Math.min(barW, 22)}
                    height={Math.max(h, 1)}
                    rx={2}
                    className="fill-amber-500 hover:fill-amber-600"
                  >
                    <title>{`${s.date}: ${fmtRs(s.revenue)} (${s.orders} orders)`}</title>
                  </rect>
                );
              })}
              <line x1={8} y1={H} x2={W - 8} y2={H} stroke="#a8a29e" strokeWidth={1} />
            </svg>
            <div className="flex justify-between text-[10px] text-stone-400">
              <span>{series[0]?.date}</span>
              <span>{series.at(-1)?.date}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TopProducts({ items }: { items: TopItem[] }) {
  if (items.length === 0)
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-bold text-stone-900">Top products</h2>
        <p className="mt-6 text-sm text-stone-400">No sales yet.</p>
      </div>
    );
  const maxQty = Math.max(...items.map((i) => i.qty), 1);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-bold text-stone-900">Top products</h2>
      <ul className="mt-4 space-y-3">
        {items.map((i) => (
          <li key={i.sku}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="truncate font-medium text-stone-700">{i.product_name}</span>
              <span className="ml-3 shrink-0 text-xs text-stone-400">
                {i.qty} sold · {fmtRs(i.revenue)}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-stone-100">
              <div
                className="h-1.5 rounded-full bg-amber-400"
                style={{ width: `${(i.qty / maxQty) * 100}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function BucketList({
  title,
  items,
  valueKey,
}: {
  title: string;
  items: Bucket[];
  valueKey: "status" | "method" | string;
}) {
  const total = items.reduce((a, b) => a + b.count, 0);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="text-lg font-bold text-stone-900">{title}</h2>
      {total === 0 ? (
        <p className="mt-6 text-sm text-stone-400">Nothing yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((b) => (
            <li key={b[valueKey as keyof Bucket] as string}>
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium capitalize text-stone-700">
                  {String(b[valueKey as keyof Bucket])}
                  <span className="text-stone-400"> · {b.count}</span>
                </span>
                <span className="text-xs text-stone-400">{fmtRs(b.revenue)}</span>
              </div>
              <div className="mt-1 h-1.5 rounded-full bg-stone-100">
                <div
                  className="h-1.5 rounded-full bg-amber-300"
                  style={{ width: `${(b.count / total) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function LowStock({ items }: { items: Product[] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-stone-900">Low stock</h2>
        <a href="/products?low=1" className="text-xs font-medium text-amber-600 hover:underline">
          View all
        </a>
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-emerald-600">All products healthy.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.slice(0, 6).map((p) => (
            <li key={p.sku} className="flex items-center justify-between text-sm">
              <span className="truncate text-stone-700">{p.name}</span>
              <span className="ml-3 shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-600">
                {p.stock_qty} left
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState<SummaryReport | null>(null);
  const [sales, setSales] = useState<SalesPoint[]>([]);
  const [top, setTop] = useState<TopItem[]>([]);
  const [statuses, setStatuses] = useState<Bucket[]>([]);
  const [methods, setMethods] = useState<Bucket[]>([]);
  const [low, setLow] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [s, sr, tp, sb, pm, ls] = await Promise.all([
          getReportSummary(),
          getSalesReport(30),
          getTopProducts(),
          getStatusBreakdown(),
          getPaymentMethods(),
          getLowStock(),
        ]);
        setSummary(s);
        setSales(sr.series);
        setTop(tp.items);
        setStatuses(sb.items);
        setMethods(pm.items);
        setLow(ls.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Load failed");
      }
    })();
  }, []);

  const changeText = useMemo(() => {
    if (summary?.week_change_pct === null || summary?.week_change_pct === undefined) return null;
    const up = summary.week_change_pct >= 0;
    return `${up ? "▲" : "▼"} ${Math.abs(summary.week_change_pct)}% vs last week`;
  }, [summary]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">Dashboard</h1>
      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Today's revenue" value={summary ? fmtRs(summary.today_revenue) : "—"} sub={`${summary?.today_orders ?? 0} orders today`} tone={summary && summary.today_revenue > 0 ? "good" : "default"} />
        <Kpi label="Total revenue" value={summary ? fmtRs(summary.total_revenue) : "—"} sub={`${summary?.total_orders ?? 0} total orders`} />
        <Kpi label="This week" value={summary ? fmtRs(summary.week_revenue) : "—"} sub={changeText ?? `${summary?.last_30_revenue ?? 0} in last 30 days`} />
        <Kpi label="To action" value={`${(summary?.pending_orders ?? 0) + (summary?.new_appointments ?? 0) + (summary?.new_custom_requests ?? 0)}`} sub={`${summary?.pending_orders ?? 0} pending orders · ${summary?.new_appointments ?? 0} appointments · ${summary?.new_custom_requests ?? 0} requests`} tone={summary && summary.pending_orders > 0 ? "warn" : "default"} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Products" value={summary ? String(summary.product_count) : "—"} sub={`${summary?.published_count ?? 0} published`} />
        <Kpi label="Low stock" value={summary ? String(summary.low_stock_count) : "—"} sub="≤ 5 units" tone={summary && summary.low_stock_count > 0 ? "warn" : "default"} />
        <Kpi label="Total orders" value={summary ? String(summary.total_orders) : "—"} sub="website" />
        <Kpi label="Appointments + requests" value={summary ? String((summary.new_appointments ?? 0) + (summary.new_custom_requests ?? 0)) : "—"} sub="new" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart series={sales} />
        </div>
        <TopProducts items={top} />
        <BucketList title="Orders by status" items={statuses} valueKey="status" />
        <BucketList title="Payment methods" items={methods} valueKey="method" />
        <LowStock items={low} />
      </div>
    </div>
  );
}