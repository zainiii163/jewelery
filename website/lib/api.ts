import type {
  Category,
  OrderResult,
  Paginated,
  Product,
  ProductMedia,
} from "./types";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000").replace(/\/$/, "");
const SHOP_CODE = process.env.NEXT_PUBLIC_SHOP_CODE || "MAIN";

/** The API serves media from its own /api/media — no symlink needed. */
export const mediaUrl = (m: Pick<ProductMedia, "path">) =>
  `${API}/api/media/${m.path}`;

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getCategories(): Promise<Category[]> {
  return get(`/api/catalog/categories?shop_code=${SHOP_CODE}`);
}

export async function getProducts(
  filters: Record<string, string | number> = {}
): Promise<Paginated<Product>> {
  const q = new URLSearchParams();
  q.set("shop_code", SHOP_CODE);
  for (const [k, v] of Object.entries(filters)) {
    if (v !== "" && v !== undefined && v !== null) q.set(k, String(v));
  }
  return get(`/api/catalog/products?${q.toString()}`);
}

export async function getProduct(sku: string): Promise<Product> {
  return get(`/api/catalog/products/${encodeURIComponent(sku)}?shop_code=${SHOP_CODE}`);
}

export async function createOrder(payload: {
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  address?: string;
  city?: string;
  payment_method?: string;
  notes?: string;
  items: { sku: string; qty: number }[];
}): Promise<OrderResult> {
  const res = await fetch(`${API}/api/checkout/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ shop_code: SHOP_CODE, ...payload }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as Partial<OrderResult> & {
    message?: string;
  };
  if (!res.ok) {
    throw new Error(data.message || `Order failed (${res.status})`);
  }
  return data as OrderResult;
}

export async function createAppointment(payload: {
  name: string;
  phone?: string;
  date: string;
  time?: string;
  purpose?: string;
  notes?: string;
}): Promise<{ ok: boolean }> {
  const res = await fetch(`${API}/api/checkout/appointments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ shop_code: SHOP_CODE, ...payload }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Appointment failed (${res.status})`);
  return res.json();
}

export async function createCustomRequest(
  form: FormData
): Promise<{ ok: boolean }> {
  form.set("shop_code", SHOP_CODE);
  const res = await fetch(`${API}/api/checkout/custom-requests`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json();
}

export const fmtMoney = (n: number) =>
  `Rs. ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;