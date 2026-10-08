'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from "react";
import { translations, type Language } from "@/i18n/translations";

export type { Language } from "@/i18n/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return "pt-BR";
    const stored = localStorage.getItem("language");
    return (stored as Language) || "pt-BR";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: string): string => {
    const [section, ...rest] = key.split(".");
    const translationKey = rest.join(".");
    const sectionTranslations = translations[language][section];
    if (sectionTranslations && sectionTranslations[translationKey]) {
      return sectionTranslations[translationKey];
    }
    return key;
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
