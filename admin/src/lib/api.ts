import type {
  OnlineOrder,
  Paginated,
  Product,
  ProductMedia,
  WebsiteAppointment,
  WebsiteCustomRequest,
} from "./types";

export const API = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const TOKEN_KEY = "jw_admin_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export const mediaUrl = (m: Pick<ProductMedia, "path">) => `${API}/storage/${m.path}`;

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (res.status === 401) {
    clearToken();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export interface LoginResult {
  token: string;
  shop: { shop_code: string; name: string };
}

export const login = (shop_code: string, password: string) =>
  request<LoginResult>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ shop_code, password }),
  });

export const listProducts = (params: Record<string, string | number> = {}) => {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== "" && v !== undefined && v !== null) q.set(k, String(v));
  }
  return request<Paginated<Product>>(`/api/shop/products?${q.toString()}`);
};

export const getProduct = (sku: string) =>
  request<Product>(`/api/shop/products/${encodeURIComponent(sku)}`);

export const upsertProduct = (payload: Record<string, unknown>) =>
  request<{ ok: boolean }>("/api/shop/products", {
    method: "POST",
    body: JSON.stringify(payload),
  });

export const uploadMedia = (sku: string, file: File) => {
  const fd = new FormData();
  fd.set("file", file);
  return request<{ ok: boolean; media_id: number; url: string }>(
    `/api/shop/products/${encodeURIComponent(sku)}/media`,
    { method: "POST", body: fd }
  );
};

export const listOrders = (status = "") =>
  request<OnlineOrder[]>(`/api/shop/orders${status ? `?status=${encodeURIComponent(status)}` : ""}`);

export const updateOrder = (id: number, patch: { status?: string; payment_status?: string }) =>
  request<{ ok: boolean; order: OnlineOrder }>(`/api/shop/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const listAppointments = () =>
  request<WebsiteAppointment[]>("/api/shop/appointments");

export const updateAppointment = (id: number, patch: { status?: string; notes?: string }) =>
  request<{ ok: boolean; appointment: WebsiteAppointment }>(`/api/shop/appointments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

export const listRequests = () => request<WebsiteCustomRequest[]>("/api/shop/custom-requests");

export const updateRequest = (id: number, patch: { status?: string }) =>
  request<{ ok: boolean; custom_request: WebsiteCustomRequest }>(`/api/shop/custom-requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });

// ---- Reports & analytics ----
export interface SummaryReport {
  total_revenue: number;
  today_revenue: number;
  last_30_revenue: number;
  week_revenue: number;
  week_change_pct: number | null;
  total_orders: number;
  today_orders: number;
  pending_orders: number;
  new_appointments: number;
  new_custom_requests: number;
  product_count: number;
  published_count: number;
  low_stock_count: number;
}

export interface SalesPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface SalesReport {
  series: SalesPoint[];
  total_revenue: number;
  total_orders: number;
}

export interface TopItem {
  sku: string;
  product_name: string;
  qty: number;
  revenue: number;
}

export interface Bucket {
  status?: string;
  method?: string;
  count: number;
  revenue: number;
}

export const getReportSummary = () => request<SummaryReport>("/api/shop/reports/summary");
export const getSalesReport = (days = 30) => request<SalesReport>(`/api/shop/reports/sales?days=${days}`);
export const getTopProducts = () => request<{ items: TopItem[] }>("/api/shop/reports/top-products?limit=10");
export const getStatusBreakdown = () => request<{ items: Bucket[] }>("/api/shop/reports/status-breakdown");
export const getPaymentMethods = () => request<{ items: Bucket[] }>("/api/shop/reports/payment-methods");
export const getLowStock = () => request<{ items: Product[] }>("/api/shop/reports/low-stock?threshold=5");

// ---- CSV exports (returns a Blob, triggers browser download) ----
export function downloadCsv(path: string, filename: string) {
  const token = getToken();
  return fetch(`${API}${path}`, {
    headers: { Accept: "text/csv", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      return res.blob();
    })
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    });
}