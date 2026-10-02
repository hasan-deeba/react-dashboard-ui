/**
 * Namespace loader.
 *
 * Every JSON file inside `src/locales/<locale>/<namespace>.json` is discovered
 * automatically — adding `locales/en/reports.json` (and its sibling in `ar`)
 * instantly makes `t("reports.<key>")` available, no registration needed.
 *
 *   locales/en/general.json  →  t("general.nav.dashboard")
 *   locales/en/users.json    →  t("users.table.title")
 */

export type Messages = { [key: string]: unknown };

export type Direction = "ltr" | "rtl";

export interface LocaleMeta {
  code: string;
  nativeName: string;
  englishName: string;
  dir: Direction;
}

export const FALLBACK_LOCALE = "en";

/** Display metadata for known locale codes (extend as you add languages). */
const LOCALE_META: Record<string, { nativeName: string; englishName: string; dir: Direction }> = {
  en: { nativeName: "English", englishName: "English", dir: "ltr" },
  ar: { nativeName: "العربية", englishName: "Arabic", dir: "rtl" },
};

const RTL_CODES = new Set(["ar", "he", "fa", "ur"]);

/** { [localeCode]: { [namespace]: messages } } */
export const DICTIONARIES: Record<string, Messages> = (() => {
  const modules = import.meta.glob("../locales/*/*.json", { eager: true });
  const dictionaries: Record<string, Messages> = {};

  for (const [path, module] of Object.entries(modules)) {
    const match = path.match(/\/locales\/([^/]+)\/([^/]+)\.json$/);
    if (!match) continue;
    const [, code, namespace] = match;
    const messages =
      (module as { default?: Messages }).default ?? (module as Messages);
    (dictionaries[code] ??= {})[namespace] = messages;
  }

  return dictionaries;
})();

export const AVAILABLE_LOCALES: string[] = Object.keys(DICTIONARIES).sort();

export function getDirection(code: string): Direction {
  return LOCALE_META[code]?.dir ?? (RTL_CODES.has(code) ? "rtl" : "ltr");
}

/** Metadata for the language switcher, driven by the discovered locales. */
export function getLocaleMeta(): LocaleMeta[] {
  return AVAILABLE_LOCALES.map((code) => ({
    code,
    nativeName: LOCALE_META[code]?.nativeName ?? code.toUpperCase(),
    englishName: LOCALE_META[code]?.englishName ?? code,
    dir: getDirection(code),
  }));
}
