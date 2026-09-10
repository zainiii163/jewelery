import { Fragment, useCallback, useEffect, useState } from "react";
import WhatsAppButton from "../components/WhatsAppButton";
import {
  getCustomer,
  getCustomerLedger,
  getCustomerPayments,
  getCustomerSales,
  listCustomers,
  upsertCustomer,
} from "../lib/api";
import type {
  Customer,
  CustomerLedgerEntry,
  CustomerPayment,
  CustomerSale,
} from "../lib/types";

const rupee = (n: number) => `Rs. ${Number(n).toLocaleString()}`;

type ProfileTab = "profile" | "ledger" | "sales" | "payments";

const EMPTY_FORM: Record<string, string> = {
  name: "",
  father_name: "",
  cnic: "",
  mobile: "",
  whatsapp: "",
  email: "",
  address: "",
  city: "",
  notes: "",
};

export default function Customers() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<Customer | null>(null);
  const [profileTab, setProfileTab] = useState<ProfileTab>("profile");
  const [sales, setSales] = useState<CustomerSale[]>([]);
  const [payments, setPayments] = useState<CustomerPayment[]>([]);
  const [ledger, setLedger] = useState<CustomerLedgerEntry[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formId, setFormId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listCustomers({ q, per_page: 200 });
      setRows(res.data);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      if (alive) load();
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [load]);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormId(null);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (c: Customer) => {
    setForm({
      name: c.name ?? "",
      father_name: c.father_name ?? "",
      cnic: c.cnic ?? "",
      mobile: c.mobile ?? "",
      whatsapp: c.whatsapp ?? "",
      email: c.email ?? "",
      address: c.address ?? "",
      city: c.city ?? "",
      notes: c.notes ?? "",
    });
    setFormId(c.id);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      await upsertCustomer({ id: formId, ...form });
      setModalOpen(false);
      await load();
      if (selected && formId === selected.id) {
        const updated = await getCustomer(selected.id);
        setSelected(updated);
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const selectCustomer = async (c: Customer) => {
    setSelected(c);
    setProfileTab("profile");
    setSales([]);
    setPayments([]);
    setLedger([]);
    try {
      const full = await getCustomer(c.id);
      setSelected(full);
    } catch {
      // keep preview data
    }
  };

  useEffect(() => {
    if (!selected) return;
    let alive = true;
    const loadTab = async () => {
      setTabLoading(true);
      try {
        if (profileTab === "sales") {
          const s = await getCustomerSales(selected.id);
          if (alive) setSales(s);
        } else if (profileTab === "payments") {
          const p = await getCustomerPayments(selected.id);
          if (alive) setPayments(p);
        } else if (profileTab === "ledger") {
          const l = await getCustomerLedger(selected.id);
          if (alive) setLedger(l);
        }
      } catch {
        // ignore tab load errors
      } finally {
        if (alive) setTabLoading(false);
      }
    };
    loadTab();
    return () => {
      alive = false;
    };
  }, [selected, profileTab]);

  const waText = selected
    ? `Salam ${selected.name}! This is Tayyab Jewellers. ${selected.remaining > 0 ? `Your remaining balance is ${rupee(selected.remaining)}.` : ""} Please feel free to reply here. Thank you!`
    : "";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">
          Customers{" "}
          <span className="text-base font-normal text-stone-400">({total})</span>
        </h1>
        <button
          onClick={openNew}
          className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700"
        >
          + New Customer
        </button>
      </div>

      <div className="mt-5 flex gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, phone or CNIC…"
          className="w-80 rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600"
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-5 overflow-hidden rounded-2xl border border-stone-200 bg-white">
        {loading ? (
          <p className="p-6 text-stone-400">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="p-6 text-stone-400">No customers found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-start text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 text-start">Name</th>
                <th className="px-4 py-3 text-start">Phone</th>
                <th className="px-4 py-3 text-start">CNIC</th>
                <th className="px-4 py-3 text-start">City</th>
                <th className="px-4 py-3 text-end">Total</th>
                <th className="px-4 py-3 text-end">Paid</th>
                <th className="px-4 py-3 text-end">Remaining</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {rows.map((c) => (
                <Fragment key={c.id}>
                  <tr
                    className="cursor-pointer hover:bg-stone-50"
                    onClick={() => selectCustomer(c)}
                  >
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-stone-900">{c.name}</p>
                      {c.father_name && (
                        <p className="text-xs text-stone-400">s/o {c.father_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-stone-600">{c.mobile ?? "—"}</td>
                    <td className="px-4 py-2.5 text-stone-500">{c.cnic ?? "—"}</td>
                    <td className="px-4 py-2.5 text-stone-600">{c.city ?? "—"}</td>
                    <td className="px-4 py-2.5 text-end font-semibold text-stone-900">
                      {rupee(c.total_amount)}
                    </td>
                    <td className="px-4 py-2.5 text-end text-green-700">
                      {rupee(c.paid)}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-end font-medium ${
                        c.remaining > 0 ? "text-red-600" : "text-stone-500"
                      }`}
                    >
                      {rupee(c.remaining)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <WhatsAppButton
                          phone={c.whatsapp || c.mobile}
                          text={`Salam ${c.name}! This is Tayyab Jewellers.${
                            c.remaining > 0
                              ? ` Your remaining balance is ${rupee(c.remaining)}.`
                              : ""
                          } Please feel free to reply here. Thank you!`}
                          label="WhatsApp"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openEdit(c);
                          }}
                          className="rounded-full border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-600 hover:border-amber-500 hover:text-amber-700"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                  {selected?.id === c.id && (
                    <tr key={`profile-${c.id}`}>
                      <td colSpan={8} className="bg-stone-50 p-0">
                        <ProfilePanel
                          customer={selected}
                          tab={profileTab}
                          setTab={setProfileTab}
                          sales={sales}
                          payments={payments}
                          ledger={ledger}
                          tabLoading={tabLoading}
                          waText={waText}
                          onClose={() => setSelected(null)}
                        />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-900">
                {formId ? "Edit Customer" : "New Customer"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            {formError && (
              <p className="mt-2 text-sm text-red-600">{formError}</p>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Name *" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
              <Field label="Father Name" value={form.father_name} onChange={(v) => setForm({ ...form, father_name: v })} />
              <Field label="CNIC" value={form.cnic} onChange={(v) => setForm({ ...form, cnic: v })} />
              <Field label="Mobile" value={form.mobile} onChange={(v) => setForm({ ...form, mobile: v })} />
              <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => setForm({ ...form, whatsapp: v })} />
              <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
              <div className="col-span-2">
                <Field label="Address" value={form.address} onChange={(v) => setForm({ ...form, address: v })} />
              </div>
              <Field label="City" value={form.city} onChange={(v) => setForm({ ...form, city: v })} />
              <div className="col-span-2">
                <label className="mb-1 block text-xs font-medium text-stone-600">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-600 hover:border-stone-400"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-amber-600 px-5 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? "Saving…" : formId ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-stone-600">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-600"
      />
    </div>
  );
}

const TAB_LABELS: { key: ProfileTab; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "ledger", label: "Ledger" },
  { key: "sales", label: "Sales" },
  { key: "payments", label: "Payments" },
];

function ProfilePanel({
  customer: c,
  tab,
  setTab,
  sales,
  payments,
  ledger,
  tabLoading,
  waText,
  onClose,
}: {
  customer: Customer;
  tab: ProfileTab;
  setTab: (t: ProfileTab) => void;
  sales: CustomerSale[];
  payments: CustomerPayment[];
  ledger: CustomerLedgerEntry[];
  tabLoading: boolean;
  waText: string;
  onClose: () => void;
}) {
  return (
    <div className="border-t border-stone-200 px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-bold text-stone-900">{c.name}</h3>
          {c.father_name && (
            <p className="text-xs text-stone-500">s/o {c.father_name}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-stone-600">
            {c.mobile && <span>📱 {c.mobile}</span>}
            {c.whatsapp && c.whatsapp !== c.mobile && <span>💬 {c.whatsapp}</span>}
            {c.email && <span>✉ {c.email}</span>}
            {c.city && <span>📍 {c.city}</span>}
            {c.cnic && <span>🪪 {c.cnic}</span>}
          </div>
          {c.address && (
            <p className="mt-1 text-xs text-stone-500">{c.address}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <WhatsAppButton phone={c.whatsapp || c.mobile} text={waText} label="WhatsApp" />
          <button
            onClick={onClose}
            className="rounded-full p-1 text-stone-400 hover:text-stone-600"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-stone-500">Total</p>
          <p className="mt-1 text-lg font-bold text-stone-900">{rupee(c.total_amount)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-stone-500">Paid</p>
          <p className="mt-1 text-lg font-bold text-green-700">{rupee(c.paid)}</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-3">
          <p className="text-xs uppercase tracking-wide text-stone-500">Remaining</p>
          <p className={`mt-1 text-lg font-bold ${c.remaining > 0 ? "text-red-600" : "text-stone-900"}`}>
            {rupee(c.remaining)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-1.5">
        {TAB_LABELS.map((t) => (
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

      <div className="mt-4 min-h-[120px]">
        {tabLoading ? (
          <p className="p-4 text-sm text-stone-400">Loading…</p>
        ) : tab === "profile" ? (
          <ProfileDetails customer={c} />
        ) : tab === "sales" ? (
          <SalesList sales={sales} />
        ) : tab === "payments" ? (
          <PaymentsList payments={payments} />
        ) : (
          <LedgerTable ledger={ledger} />
        )}
      </div>
    </div>
  );
}

function ProfileDetails({ customer: c }: { customer: Customer }) {
  const fields = [
    ["Name", c.name],
    ["Father Name", c.father_name],
    ["CNIC", c.cnic],
    ["Mobile", c.mobile],
    ["WhatsApp", c.whatsapp],
    ["Email", c.email],
    ["Address", c.address],
    ["City", c.city],
    ["Notes", c.notes],
    ["Created", c.created_at ? new Date(c.created_at).toLocaleDateString() : null],
  ].filter((f): f is [string, string] => Boolean(f[1]));

  if (fields.length === 0) {
    return <p className="p-4 text-sm text-stone-400">No additional details.</p>;
  }

  return (
    <div className="space-y-2">
      {fields.map(([label, val]) => (
        <div key={label} className="flex gap-4 text-sm">
          <span className="w-28 shrink-0 text-xs font-medium text-stone-500">{label}</span>
          <span className="text-stone-800">{val}</span>
        </div>
      ))}
    </div>
  );
}

function SalesList({ sales }: { sales: CustomerSale[] }) {
  if (sales.length === 0) {
    return <p className="p-4 text-sm text-stone-400">No sales found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-start text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-3 py-2 text-start">Invoice</th>
            <th className="px-3 py-2 text-start">Date</th>
            <th className="px-3 py-2 text-start">Items</th>
            <th className="px-3 py-2 text-end">Total</th>
            <th className="px-3 py-2 text-end">Paid</th>
            <th className="px-3 py-2 text-end">Remaining</th>
            <th className="px-3 py-2 text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {sales.map((s) => (
            <tr key={s.id} className="hover:bg-stone-50">
              <td className="px-3 py-2 font-medium text-stone-800">{s.invoice_no}</td>
              <td className="px-3 py-2 text-stone-600">
                {new Date(s.date).toLocaleDateString()}
              </td>
              <td className="px-3 py-2 text-stone-600">{s.items_summary}</td>
              <td className="px-3 py-2 text-end font-semibold">{rupee(s.total)}</td>
              <td className="px-3 py-2 text-end text-green-700">{rupee(s.paid)}</td>
              <td
                className={`px-3 py-2 text-end font-medium ${
                  s.remaining > 0 ? "text-red-600" : "text-stone-500"
                }`}
              >
                {rupee(s.remaining)}
              </td>
              <td className="px-3 py-2 text-center">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    s.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : s.status === "cancelled"
                        ? "bg-red-100 text-red-600"
                        : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {s.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentsList({ payments }: { payments: CustomerPayment[] }) {
  if (payments.length === 0) {
    return <p className="p-4 text-sm text-stone-400">No payments found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-start text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-3 py-2 text-start">Date</th>
            <th className="px-3 py-2 text-end">Amount</th>
            <th className="px-3 py-2 text-start">Method</th>
            <th className="px-3 py-2 text-start">Reference</th>
            <th className="px-3 py-2 text-start">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {payments.map((p) => (
            <tr key={p.id} className="hover:bg-stone-50">
              <td className="px-3 py-2 text-stone-600">
                {new Date(p.date).toLocaleDateString()}
              </td>
              <td className="px-3 py-2 text-end font-semibold text-green-700">
                {rupee(p.amount)}
              </td>
              <td className="px-3 py-2 capitalize text-stone-600">{p.method}</td>
              <td className="px-3 py-2 text-stone-500">{p.reference ?? "—"}</td>
              <td className="px-3 py-2 text-stone-500">{p.notes ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LedgerTable({ ledger }: { ledger: CustomerLedgerEntry[] }) {
  if (ledger.length === 0) {
    return <p className="p-4 text-sm text-stone-400">No ledger entries found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-start text-xs uppercase tracking-wide text-stone-500">
          <tr>
            <th className="px-3 py-2 text-start">Date</th>
            <th className="px-3 py-2 text-start">Type</th>
            <th className="px-3 py-2 text-start">Description</th>
            <th className="px-3 py-2 text-end">Debit</th>
            <th className="px-3 py-2 text-end">Credit</th>
            <th className="px-3 py-2 text-end">Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {ledger.map((e) => (
            <tr key={e.id} className="hover:bg-stone-50">
              <td className="px-3 py-2 text-stone-600">
                {new Date(e.date).toLocaleDateString()}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    e.type === "sale"
                      ? "bg-blue-100 text-blue-700"
                      : e.type === "payment"
                        ? "bg-green-100 text-green-700"
                        : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {e.type}
                </span>
              </td>
              <td className="px-3 py-2 text-stone-600">{e.description}</td>
              <td className="px-3 py-2 text-end font-medium text-red-600">
                {e.debit > 0 ? rupee(e.debit) : "—"}
              </td>
              <td className="px-3 py-2 text-end font-medium text-green-700">
                {e.credit > 0 ? rupee(e.credit) : "—"}
              </td>
              <td className="px-3 py-2 text-end font-semibold text-stone-900">
                {rupee(e.balance)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
