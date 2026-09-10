import { useCallback, useEffect, useState } from "react";
import { API, getToken } from "../lib/api";

interface ShopSettings {
  shop_name: string;
  address: string;
  phone: string;
  whatsapp: string;
  currency_symbol: string;
  tax_rate: string;
  language: string;
  server_url: string;
  shop_code: string;
  api_token: string;
}

const defaults: ShopSettings = {
  shop_name: "",
  address: "",
  phone: "",
  whatsapp: "",
  currency_symbol: "Rs.",
  tax_rate: "0",
  language: "en",
  server_url: "",
  shop_code: "MAIN",
  api_token: "",
};

export default function Settings() {
  const [settings, setSettings] = useState<ShopSettings>(defaults);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const authHeaders = () => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/shop/settings`, {
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error(`Failed to load settings (${res.status})`);
      const data = await res.json();
      setSettings((prev) => ({
        ...prev,
        ...(data.settings ?? data),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`${API}/api/shop/settings`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ ...settings, shop_code: settings.shop_code || "MAIN" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Save failed (${res.status})`);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof ShopSettings, value: string) =>
    setSettings((prev) => ({ ...prev, [key]: value }));

  const Section = ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div className="rounded-2xl border border-stone-200 bg-white p-6">
      <h2 className="mb-4 text-lg font-bold text-stone-900">{title}</h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );

  const Field = ({
    label,
    value,
    onChange,
    type = "text",
    placeholder,
    readOnly,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    placeholder?: string;
    readOnly?: boolean;
  }) => (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 ${
          readOnly ? "bg-stone-50 text-stone-500" : ""
        }`}
      />
    </div>
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <p className="mt-5 text-stone-400">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-amber-600 px-6 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && (
        <p className="text-sm font-semibold text-green-600">Settings saved successfully.</p>
      )}

      <Section title="Shop Information">
        <Field
          label="Shop Name"
          value={settings.shop_name}
          onChange={(v) => update("shop_name", v)}
          placeholder="Tayyab Jewellers"
        />
        <Field
          label="Address"
          value={settings.address}
          onChange={(v) => update("address", v)}
          placeholder="Main Bazaar, Lahore"
        />
        <Field
          label="Phone"
          value={settings.phone}
          onChange={(v) => update("phone", v)}
          placeholder="+92 300 1234567"
        />
        <Field
          label="WhatsApp"
          value={settings.whatsapp}
          onChange={(v) => update("whatsapp", v)}
          placeholder="+92 300 1234567"
        />
        <Field
          label="Currency Symbol"
          value={settings.currency_symbol}
          onChange={(v) => update("currency_symbol", v)}
          placeholder="Rs."
        />
        <Field
          label="Tax Rate (%)"
          value={settings.tax_rate}
          onChange={(v) => update("tax_rate", v)}
          type="number"
          placeholder="0"
        />
      </Section>

      <Section title="Language">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
            Preferred Language
          </label>
          <div className="flex gap-3">
            {[
              { code: "en", label: "English" },
              { code: "ur", label: "اردو (Urdu)" },
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => update("language", lang.code)}
                className={`rounded-full border px-5 py-2 text-sm font-semibold transition ${
                  settings.language === lang.code
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-stone-300 text-stone-600 hover:border-amber-400 hover:text-amber-600"
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Cloud / Server Settings">
        <Field
          label="Server URL"
          value={settings.server_url}
          onChange={(v) => update("server_url", v)}
          placeholder="https://api.example.com"
        />
        <Field
          label="Shop Code"
          value={settings.shop_code}
          onChange={(v) => update("shop_code", v)}
          placeholder="MAIN"
          readOnly
        />
        <div className="sm:col-span-2">
          <Field
            label="API Token"
            value={settings.api_token}
            onChange={(v) => update("api_token", v)}
            placeholder="Enter API token"
            type="password"
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-amber-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
