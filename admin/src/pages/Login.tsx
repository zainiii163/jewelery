import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

export default function Login() {
  const { token, login } = useAuth();
  const nav = useNavigate();
  const [shop_code, setShopCode] = useState("MAIN");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPass, setShowPass] = useState(false);

  if (token) nav("/", { replace: true });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(shop_code, password);
      nav("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-stone-950 via-stone-900 to-amber-950 px-4">
      <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(600px 300px at 30% 40%, #b45309, transparent), radial-gradient(500px 280px at 70% 60%, #78350f, transparent)" }} />

      <form
        onSubmit={submit}
        className="relative w-full max-w-sm rounded-3xl border border-stone-200/10 bg-white/95 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col items-center">
          <img src="/logo.svg" alt="Tayyab Jewellers" className="h-20 w-auto" />
          <h1 className="mt-4 text-xl font-black text-stone-900">Admin Panel</h1>
          <p className="mt-1 text-sm text-stone-500">Sign in to manage your shop</p>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Shop Code</label>
            <input
              value={shop_code}
              onChange={(e) => setShopCode(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 pr-12 text-sm font-medium outline-none transition-colors focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
                required
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPass ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-600/25 transition-all hover:from-amber-500 hover:to-amber-400 hover:shadow-xl hover:shadow-amber-600/30 disabled:opacity-50"
        >
          {busy ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4m0 12v4m-7.07-3.93l2.83-2.83m8.48-8.48l2.83-2.83M2 12h4m12 0h4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83" /></svg>
              Signing in…
            </span>
          ) : "Sign In"}
        </button>

        <p className="mt-6 text-center text-xs text-stone-400">
          Default: <span className="font-mono">MAIN</span> / <span className="font-mono">changeme</span>
        </p>
      </form>
    </div>
  );
}
