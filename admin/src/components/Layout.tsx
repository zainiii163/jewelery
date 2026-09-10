import { NavLink, Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";

const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/products", label: "Products" },
  { to: "/orders", label: "Orders" },
  { to: "/appointments", label: "Appointments" },
  { to: "/requests", label: "Custom Requests" },
  { to: "/reports", label: "Reports" },
];

export default function Layout() {
  const { token, shopName, logout } = useAuth();

  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 flex-col border-e border-stone-200 bg-stone-950 text-stone-300">
        <div className="flex items-center gap-2 px-5 py-5">
          <img src="/logo.png" alt="Tayyab Jewellers" className="h-10 w-auto" />
          <div>
            <p className="text-sm font-bold text-white">Admin Panel</p>
            <p className="text-xs text-stone-500">{shopName || "…"}</p>
          </div>
        </div>
        <nav className="mt-2 flex-1 space-y-1 px-3">
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-amber-600 text-white" : "hover:bg-stone-800 hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={logout}
          className="m-3 rounded-lg px-3 py-2 text-start text-sm font-medium text-stone-400 hover:bg-stone-800 hover:text-white"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 overflow-x-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}