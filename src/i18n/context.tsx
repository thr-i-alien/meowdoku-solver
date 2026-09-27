import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language, Translations } from './types';
import { zhTW } from './locales/zh-TW';
import { en } from './locales/en';

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: Translations;
  interpolate: (str: string, params?: Record<string, string | number>) => string;
}

const translationsMap: Record<Language, Translations> = {
  'zh-TW': zhTW,
  en,
};

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'meowdoku_language_preference';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'zh-TW') {
        return saved;
      }
      const navLang = navigator.language.toLowerCase();
      if (navLang.startsWith('zh')) {
        return 'zh-TW';
      }
      // 預設以繁體中文為優先，若使用者系統為英文則可使用英文
      return 'zh-TW';
    } catch {
      return 'zh-TW';
    }
  });

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Failed to save language preference', e);
    }
  };

  const toggleLang = () => {
    setLang(lang === 'zh-TW' ? 'en' : 'zh-TW');
  };

  useEffect(() => {
    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-TW';
    document.title =
      lang === 'en'
        ? 'Meowdoku Solver - Cat Sudoku Logic Deduction & Player'
        : 'Meowdoku Solver - 貓咪數獨智能推導器';
  }, [lang]);

  const interpolate = (str: string, params?: Record<string, string | number>): string => {
    if (!params) return str;
    return str.replace(/\{(\w+)\}/g, (_, key) => {
      return params[key] !== undefined ? String(params[key]) : `{${key}}`;
    });
  };

  const value: I18nContextValue = {
    lang,
    setLang,
    toggleLang,
    t: translationsMap[lang],
    interpolate,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
};
