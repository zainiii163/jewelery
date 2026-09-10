"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: CartItem) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const KEY = "jw_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* ignore corrupt cart */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = useCallback((item: CartItem) => {
    setItems((prev) => {
      const found = prev.find((i) => i.sku === item.sku);
      if (found) {
        return prev.map((i) =>
          i.sku === item.sku ? { ...i, qty: i.qty + item.qty } : i
        );
      }
      return [...prev, item];
    });
  }, []);

  const setQty = useCallback((sku: string, qty: number) => {
    setItems((prev) =>
      prev.map((i) => (i.sku === sku ? { ...i, qty: Math.max(1, qty) } : i))
    );
  }, []);

  const remove = useCallback(
    (sku: string) => setItems((prev) => prev.filter((i) => i.sku !== sku)),
    []
  );

  const clear = useCallback(() => setItems([]), []);

  const { count, subtotal } = useMemo(() => {
    let c = 0;
    let s = 0;
    for (const i of items) {
      c += i.qty;
      s += i.qty * i.unitPrice;
    }
    return { count: c, subtotal: s };
  }, [items]);

  const value = useMemo(
    () => ({ items, count, subtotal, add, setQty, remove, clear }),
    [items, count, subtotal, add, setQty, remove, clear]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}