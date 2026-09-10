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

  if (token) {
    nav("/", { replace: true });
  }

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
    <div className="grid min-h-screen place-items-center bg-stone-950 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <img src="/logo.png" alt="Tayyab Jewellers" className="mx-auto h-16 w-auto" />
        <h1 className="mt-4 text-center text-xl font-bold text-stone-900">
          Admin Panel
        </h1>
        <p className="mt-1 text-center text-sm text-stone-500">
          Sign in with website credentials
        </p>

        <div className="mt-6 space-y-3">
          <input
            value={shop_code}
            onChange={(e) => setShopCode(e.target.value)}
            placeholder="Shop Code"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-amber-600"
            required
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="mt-6 w-full rounded-full bg-amber-600 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign In"}
        </button>
      </form>
    </div>
  );
}