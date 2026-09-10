export type Category = {
  id: number;
  name: string;
  slug: string | null;
  products_count?: number;
};

export type ProductMedia = {
  id: number;
  path: string;
  kind: string;
  sort: number;
};

export type Product = {
  id: number;
  sku: string;
  name: string;
  category: { id: number; name: string; slug: string | null } | null;
  metal_type: "gold" | "silver";
  purity: number | null;
  karat: number | null;
  gross_weight: number;
  net_weight: number;
  stone_weight: number;
  making_charges: number;
  stone_charges: number;
  sale_price: number;
  status: string;
  stock_qty: number;
  description: string | null;
  featured: boolean;
  new_arrival: boolean;
  media: ProductMedia[];
};

export type Paginated<T> = {
  current_page: number;
  data: T[];
  total: number;
  last_page: number;
  per_page: number;
};

export type OrderResult = {
  ok: boolean;
  order_number: string;
  grand_total: number;
};

export type CartItem = {
  sku: string;
  name: string;
  unitPrice: number;
  qty: number;
  image?: string;
};