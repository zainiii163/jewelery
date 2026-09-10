import { useCallback, useEffect, useState } from "react";
import WhatsAppButton from "../components/WhatsAppButton";
import { listAppointments, updateAppointment } from "../lib/api";
import type { WebsiteAppointment } from "../lib/types";

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled", "No Show"];

const appointmentWaText = (a: WebsiteAppointment) => {
  const when = [a.date || "", a.time || ""].filter(Boolean).join(" at ");
  return [
    `Salam ${a.name}! This is Tayyab Jewellers.`,
    when ? `Your appointment is ${when}.` : "Your appointment has been received.",
    a.purpose ? `Purpose: ${a.purpose}` : "",
    `Status: ${a.status}`,
    "Please confirm by replying here. Thank you!",
  ]
    .filter(Boolean)
    .join("\n");
};

export default function Appointments() {
  const [rows, setRows] = useState<WebsiteAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAppointments());
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
      await updateAppointment(id, { status });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900">
        Appointments <span className="text-base font-normal text-stone-400">({rows.length})</span>
      </h1>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-stone-400">No appointment requests yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start">Name</th>
                <th className="px-4 py-3 text-start">Phone</th>
                <th className="px-4 py-3 text-start">Date & Time</th>
                <th className="px-4 py-3 text-start">Purpose</th>
                <th className="px-4 py-3 text-start">Status</th>
                <th className="px-4 py-3 text-start">Requested</th>
                <th className="px-4 py-3 text-end">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-stone-50">
                  <td className="px-4 py-2.5 font-semibold text-stone-900">{a.name}</td>
                  <td className="px-4 py-2.5">{a.phone ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {a.date ? `${a.date}${a.time ? ` ${a.time}` : ""}` : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-stone-600">{a.purpose ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <select
                      value={a.status}
                      onChange={(e) => patch(a.id, e.target.value)}
                      className="rounded-lg border border-stone-300 px-2 py-1 text-xs outline-none"
                    >
                      {STATUSES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-stone-500">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2.5 text-end">
                    <WhatsAppButton phone={a.phone} text={appointmentWaText(a)} />
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