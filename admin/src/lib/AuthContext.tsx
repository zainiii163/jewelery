import { createContext, useContext, useState, type ReactNode } from "react";
import { clearToken, getToken, login as apiLogin, setToken as saveToken } from "../lib/api";

interface AuthState {
  token: string | null;
  shopName: string | null;
  login: (shop_code: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [shopName, setShopName] = useState<string | null>(() =>
    localStorage.getItem("jw_admin_shop")
  );

  const login = async (shop_code: string, password: string) => {
    const res = await apiLogin(shop_code, password);
    saveToken(res.token);
    setTokenState(res.token);
    setShopName(res.shop.name);
    localStorage.setItem("jw_admin_shop", res.shop.name);
  };

  const logout = () => {
    clearToken();
    localStorage.removeItem("jw_admin_shop");
    setTokenState(null);
    setShopName(null);
  };

  return (
    <AuthContext.Provider value={{ token, shopName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
