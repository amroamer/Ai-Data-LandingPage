import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import en from "./locales/en.json";
import ar from "./locales/ar.json";

// Locale bundle map. Adding a new language = drop in a JSON + register it here.
const BUNDLES = { en, ar };

// Languages that render right-to-left. The provider toggles <html dir> to match.
const RTL_LANGS = new Set(["ar"]);

// Where the user's choice is persisted across reloads.
const STORAGE_KEY = "kpmg-lang";

const I18nContext = createContext(null);

/**
 * Walk a dotted key path (e.g. "auth.login.title") into a locale bundle.
 * Returns the original key when the path doesn't resolve, so missing
 * translations are visible in the UI rather than silently rendering empty.
 */
function resolve(bundle, key) {
  const parts = key.split(".");
  let node = bundle;
  for (const p of parts) {
    if (node == null || typeof node !== "object") return key;
    node = node[p];
  }
  return node == null ? key : node;
}

/**
 * Substitute `{name}` placeholders in a translated string using the supplied
 * `vars` object. Non-string translations (arrays, objects) are returned as-is.
 */
function interpolate(value, vars) {
  if (typeof value !== "string" || !vars) return value;
  return value.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? String(vars[k]) : `{${k}}`));
}

/**
 * Read the initial language: persisted choice → browser default → English.
 * Falls back to "en" on storage-access errors (e.g. private browsing).
 */
function detectInitialLang() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && BUNDLES[stored]) return stored;
  } catch {}
  if (typeof navigator !== "undefined") {
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    if (BUNDLES[browser]) return browser;
  }
  return "en";
}

/**
 * Provides the current language, a translator function `t`, and a setter.
 * Also keeps `<html lang>` and `<html dir>` in sync so CSS and assistive tech
 * see the correct locale and direction.
 */
export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectInitialLang);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
    }
  }, [lang]);

  const setLang = useCallback((next) => {
    if (BUNDLES[next]) setLangState(next);
  }, []);

  const t = useCallback(
    (key, vars) => interpolate(resolve(BUNDLES[lang] || BUNDLES.en, key), vars),
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      isRTL: RTL_LANGS.has(lang),
      available: Object.keys(BUNDLES),
    }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook for consuming i18n state. Throws when used outside an `I18nProvider`
 * so misuse fails loudly instead of silently rendering keys.
 */
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

/**
 * Convenience hook for components that only need the translator function.
 */
export function useT() {
  return useI18n().t;
}
