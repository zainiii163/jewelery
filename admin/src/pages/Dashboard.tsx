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

function KpiCard({ label, value, sub, icon, gradient }: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} p-5 text-white shadow-lg`}>
      <div className="absolute -end-4 -top-4 opacity-10">{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      {sub && <p className="mt-1 text-xs text-white/60">{sub}</p>}
    </div>
  );
}

function MiniKpi({ label, value, sub, color = "amber" }: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  const colors: Record<string, string> = {
    amber: "border-l-amber-500 bg-amber-50/50",
    emerald: "border-l-emerald-500 bg-emerald-50/50",
    rose: "border-l-rose-500 bg-rose-50/50",
    blue: "border-l-blue-500 bg-blue-50/50",
  };
  return (
    <div className={`rounded-xl border-l-4 ${colors[color] || colors.amber} bg-white p-4 shadow-sm`}>
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-stone-400">{sub}</p>}
    </div>
  );
}

function RevenueChart({ series }: { series: SalesPoint[] }) {
  const max = Math.max(...series.map((s) => s.revenue), 1);
  const W = 720;
  const H = 200;
  const barW = Math.max(4, (W - 20) / Math.max(series.length, 1) - 2);
  const fmt = (v: number) =>
    v >= 100000 ? (v / 100000).toFixed(1) + "L" : v >= 1000 ? (v / 1000).toFixed(0) + "k" : String(v);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-stone-900">Revenue</h2>
          <p className="text-xs text-stone-400">Last 30 days</p>
        </div>
        <div className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {series.length} days
        </div>
      </div>
      {series.length === 0 || (max === 1 && series.every((s) => s.revenue === 0)) ? (
        <div className="mt-8 grid place-items-center py-8">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-stone-300">
            <path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-8" />
          </svg>
          <p className="mt-3 text-sm text-stone-400">No sales yet</p>
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[560px]">
            <svg viewBox={`0 0 ${W} ${H + 26}`} className="block">
              {[0.25, 0.5, 0.75, 1].map((f) => (
                <g key={f}>
                  <line x1={8} y1={H - f * H} x2={W - 8} y2={H - f * H} stroke="#f5f5f4" strokeWidth={1} />
                  <text x={W - 8} y={H - f * H - 4} textAnchor="end" className="fill-stone-400" fontSize={10}>
                    {fmt(max * f)}
                  </text>
                </g>
              ))}
              {series.map((s, i) => {
                const h = (s.revenue / max) * H;
                const x = 8 + i * (barW + 2);
                return (
                  <rect
                    key={s.date}
                    x={x}
                    y={H - h}
                    width={Math.min(barW, 20)}
                    height={Math.max(h, 1)}
                    rx={3}
                    className="fill-amber-400 transition-colors hover:fill-amber-500"
                  >
                    <title>{`${s.date}: ${fmtRs(s.revenue)} (${s.orders} orders)`}</title>
                  </rect>
                );
              })}
              <line x1={8} y1={H} x2={W - 8} y2={H} stroke="#e7e5e4" strokeWidth={1} />
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
  const maxQty = Math.max(...items.map((i) => i.qty), 1);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-stone-900">Top Products</h2>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-stone-400">No sales yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((i, idx) => (
            <li key={i.sku}>
              <div className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="truncate font-medium text-stone-700">{i.product_name}</span>
                    <span className="ml-2 shrink-0 text-xs text-stone-400">{i.qty} sold</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-stone-100">
                    <div className="h-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500" style={{ width: `${(i.qty / maxQty) * 100}%` }} />
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BucketList({ title, items, valueKey }: {
  title: string;
  items: Bucket[];
  valueKey: "status" | "method" | string;
}) {
  const total = items.reduce((a, b) => a + b.count, 0);
  const statusColors: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    confirmed: "bg-blue-100 text-blue-700",
    "in progress": "bg-purple-100 text-purple-700",
    ready: "bg-emerald-100 text-emerald-700",
    completed: "bg-stone-100 text-stone-600",
    cancelled: "bg-red-100 text-red-600",
    paid: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-600",
  };
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-stone-900">{title}</h2>
      {total === 0 ? (
        <p className="mt-6 text-sm text-stone-400">Nothing yet.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {items.map((b) => {
            const key = String(b[valueKey as keyof Bucket]);
            return (
              <li key={key}>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColors[key] || "bg-stone-100 text-stone-600"}`}>
                      {key}
                    </span>
                    <span className="text-stone-400">{b.count}</span>
                  </div>
                  <span className="text-xs font-medium text-stone-500">{fmtRs(b.revenue)}</span>
                </div>
                <div className="mt-1.5 h-1 rounded-full bg-stone-100">
                  <div className="h-1 rounded-full bg-amber-400" style={{ width: `${(b.count / total) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function LowStock({ items }: { items: Product[] }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-stone-900">Low Stock</h2>
        {items.length > 0 && (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-600">
            {items.length} alerts
          </span>
        )}
      </div>
      {items.length === 0 ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-emerald-600">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
          All products healthy
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.slice(0, 6).map((p) => (
            <li key={p.sku} className="flex items-center justify-between rounded-lg bg-red-50/50 px-3 py-2 text-sm">
              <span className="truncate text-stone-700">{p.name}</span>
              <span className="ml-3 shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
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
    return `${up ? "↑" : "↓"} ${Math.abs(summary.week_change_pct)}% vs last week`;
  }, [summary]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500">Welcome back. Here&apos;s what&apos;s happening today.</p>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
      )}

      {/* Hero KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Today's Revenue"
          value={summary ? fmtRs(summary.today_revenue) : "—"}
          sub={`${summary?.today_orders ?? 0} orders`}
          gradient="from-amber-600 to-orange-500"
          icon={<svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>}
        />
        <KpiCard
          label="Total Revenue"
          value={summary ? fmtRs(summary.total_revenue) : "—"}
          sub={`${summary?.total_orders ?? 0} total orders`}
          gradient="from-stone-800 to-stone-900"
          icon={<svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>}
        />
        <KpiCard
          label="This Week"
          value={summary ? fmtRs(summary.week_revenue) : "—"}
          sub={changeText ?? "No data"}
          gradient="from-emerald-600 to-teal-500"
          icon={<svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M23 6l-9.5 9.5-5-5L1 18" /></svg>}
        />
        <KpiCard
          label="To Action"
          value={`${(summary?.pending_orders ?? 0) + (summary?.new_appointments ?? 0) + (summary?.new_custom_requests ?? 0)}`}
          sub={`${summary?.pending_orders ?? 0} orders · ${summary?.new_appointments ?? 0} appts`}
          gradient="from-rose-600 to-pink-500"
          icon={<svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>}
        />
      </div>

      {/* Mini KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniKpi label="Products" value={summary ? String(summary.product_count) : "—"} sub={`${summary?.published_count ?? 0} published`} color="amber" />
        <MiniKpi label="Low Stock" value={summary ? String(summary.low_stock_count) : "—"} sub="≤ 5 units" color={summary && summary.low_stock_count > 0 ? "rose" : "emerald"} />
        <MiniKpi label="Orders" value={summary ? String(summary.total_orders) : "—"} sub="website orders" color="blue" />
        <MiniKpi label="Appointments" value={summary ? String((summary.new_appointments ?? 0) + (summary.new_custom_requests ?? 0)) : "—"} sub="pending" color="amber" />
      </div>

      {/* Charts */}
      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RevenueChart series={sales} />
        </div>
        <TopProducts items={top} />
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BucketList title="Orders by Status" items={statuses} valueKey="status" />
        <BucketList title="Payment Methods" items={methods} valueKey="method" />
        <LowStock items={low} />
      </div>
    </div>
  );
}
