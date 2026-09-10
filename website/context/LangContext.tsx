"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { dict, type Lang } from "@/lib/i18n";

type LangContextValue = {
  lang: Lang;
  t: (key: string) => string;
  setLang: (l: Lang) => void;
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const saved = localStorage.getItem("jw_lang");
    const detected = saved === "ur" ? "ur" : "en";
    setLangState(detected);
    document.documentElement.lang = detected;
    document.documentElement.dir = detected === "ur" ? "rtl" : "ltr";
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("jw_lang", l);
    document.documentElement.lang = l;
    document.documentElement.dir = l === "ur" ? "rtl" : "ltr";
  };

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      t: (key: string) => dict[lang][key] ?? key,
      setLang,
    }),
    [lang]
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}