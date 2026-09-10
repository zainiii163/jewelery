export interface Category {
  id: number;
  name: string;
  slug: string | null;
  products_count?: number;
}

export interface ProductMedia {
  id: number;
  product_id: number;
  path: string;
  kind: "image" | "video";
  sort: number;
  url?: string;
}

export interface Product {
  id: number;
  shop_id: number;
  sku: string;
  name: string;
  category_id: number | null;
  category?: Category | null;
  metal_type: "gold" | "silver";
  purity: number | null;
  karat: number | null;
  gross_weight: number;
  net_weight: number;
  stone_weight: number;
  rate: number | null;
  making_charges: number;
  stone_charges: number;
  sale_price: number;
  purchase_cost: number;
  status: string;
  published: boolean;
  featured: boolean;
  new_arrival: boolean;
  best_seller: boolean;
  stock_qty: number;
  description: string | null;
  media: ProductMedia[];
  created_at: string;
  updated_at: string;
}

export interface Paginated<T> {
  current_page: number;
  data: T[];
  total: number;
  per_page: number;
  last_page: number;
}

export interface OnlineOrderItem {
  id: number;
  order_id: number;
  product_sku: string;
  product_name: string;
  unit_price: number;
  qty: number;
  line_total: number;
}

export interface OnlineOrder {
  id: number;
  order_number: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  city: string | null;
  address: string | null;
  items_summary: string | null;
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: "pending" | "paid" | "failed";
  status: string;
  notes: string | null;
  created_at: string;
  items: OnlineOrderItem[];
}

export interface WebsiteAppointment {
  id: number;
  name: string;
  phone: string | null;
  date: string | null;
  time: string | null;
  purpose: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

export interface WebsiteCustomRequest {
  id: number;
  name: string;
  phone: string | null;
  jewellery_type: string | null;
  metal: string | null;
  karat: number | null;
  budget: number | null;
  description: string | null;
  status: string;
  created_at: string;
}