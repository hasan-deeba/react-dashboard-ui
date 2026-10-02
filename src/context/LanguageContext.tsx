import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AVAILABLE_LOCALES,
  DICTIONARIES,
  FALLBACK_LOCALE,
  getDirection,
  type Direction,
  type Messages,
} from "@/i18n/locales";
import { setFormatLocale } from "@/lib/format";

export type Locale = string;

interface LanguageContextValue {
  locale: Locale;
  dir: Direction;
  isRtl: boolean;
  setLocale: (locale: Locale) => void;
  /** Dotted lookup with namespace prefix, e.g. t("dashboard.stats.revenue") */
  t: (key: string, params?: Record<string, string | number>) => string;
  /** True when a translation exists (in the active locale or the fallback). */
  exists: (key: string) => boolean;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "lang";

/** Saved preference wins, otherwise infer from the browser language. */
function getInitialLocale(): Locale {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved && AVAILABLE_LOCALES.includes(saved)) return saved;
  const browser = navigator.language.toLowerCase();
  return (
    AVAILABLE_LOCALES.find((code) => browser.startsWith(code)) ?? FALLBACK_LOCALE
  );
}

/**
 * Resolve a dotted key against a namespaced dictionary.
 * "dashboard.stats.revenue" → DICTIONARIES.en.dashboard.stats.revenue
 */
function resolve(dict: Messages | undefined, key: string): string | undefined {
  if (!dict) return undefined;
  const value = key
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        node && typeof node === "object" ? (node as Record<string, unknown>)[part] : undefined,
      dict,
    );
  return typeof value === "string" ? value : undefined;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Locale is read once per page load; `setLocale` persists + reloads.
  const [locale] = useState<Locale>(getInitialLocale);
  const dir = getDirection(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = dir;
    window.localStorage.setItem(STORAGE_KEY, locale);
    setFormatLocale(locale);
  }, [locale, dir]);

  /**
   * Switching language reloads the page.
   *
   * The API localises its payloads from the `Accept-Language` header, so
   * every already-fetched list, builder and record still holds strings in
   * the previous language. Persist the choice first (the pre-paint script in
   * index.html applies lang/dir before React mounts), then reload so all
   * data is refetched in the new locale.
   */
  const setLocale = useCallback(
    (next: Locale) => {
      if (!AVAILABLE_LOCALES.includes(next) || next === locale) return;

      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
      document.documentElement.dir = getDirection(next);
      window.location.reload();
    },
    [locale],
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value =
        resolve(DICTIONARIES[locale], key) ??
        resolve(DICTIONARIES[FALLBACK_LOCALE], key) ??
        key;
      if (params) {
        for (const [name, replacement] of Object.entries(params)) {
          value = value.split(`{${name}}`).join(String(replacement));
        }
      }
      return value;
    },
    [locale],
  );

  const exists = useCallback(
    (key: string): boolean =>
      resolve(DICTIONARIES[locale], key) !== undefined ||
      resolve(DICTIONARIES[FALLBACK_LOCALE], key) !== undefined,
    [locale],
  );

  const value = useMemo(
    () => ({ locale, dir, isRtl: dir === "rtl", setLocale, t, exists }),
    [locale, dir, setLocale, t, exists],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
