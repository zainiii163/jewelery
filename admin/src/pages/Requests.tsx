import { useCallback, useEffect, useState } from "react";
import { listRequests, updateRequest } from "../lib/api";
import type { WebsiteCustomRequest } from "../lib/types";

const STATUSES = ["Pending", "In Progress", "Quoted", "Completed", "Rejected"];

export default function Requests() {
  const [rows, setRows] = useState<WebsiteCustomRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listRequests());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: number, status: string) => {
    try {
      await updateRequest(id, { status });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">
        Custom Requests <span className="text-base font-normal text-stone-400">({rows.length})</span>
      </h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-stone-400">No custom design requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start">Name</th>
                <th className="px-4 py-3 text-start">Phone</th>
                <th className="px-4 py-3 text-start">Jewellery</th>
                <th className="px-4 py-3 text-start">Metal</th>
                <th className="px-4 py-3 text-end">Budget</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3 text-start">Requested</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((r) => (
                <tr key={r.id} className="align-top hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-semibold text-stone-900">{r.name}</td>
                  <td className="px-4 py-2.5">{r.phone ?? "—"}</td>
                  <td className="px-4 py-2.5 text-stone-600">{r.jewellery_type ?? "—"}</td>
                  <td className="px-4 py-2.5 capitalize text-stone-600">
                    {r.metal ?? "—"}
                    {r.karat ? ` ${r.karat}K` : ""}
                  </td>
                  <td className="px-4 py-2.5 text-end text-stone-700">
                    {r.budget ? `Rs. ${Number(r.budget).toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={r.status}
                      onChange={(e) => patch(r.id, e.target.value)}
                      className="rounded-lg border border-stone-300 px-2 py-1 text-xs outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-500">
                    {new Date(r.created_at).toLocaleString()}
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