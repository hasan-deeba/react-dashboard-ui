/**
 * Locale-aware value formatting.
 *
 * PURPOSE : numbers, currency and relative time rendered in the active
 *           locale (Arabic numerals, RTL-friendly units, etc).
 * EXPORTS : setFormatLocale(), formatCurrency(), formatCompact(),
 *           formatNumber(), formatDate(), formatTimeAgo(), minutesAgo().
 * EDIT    : `setFormatLocale` is called by LanguageProvider on every locale
 *           change — keep these as plain functions so call sites stay simple.
 *
 * NOTE    : `formatDate` is NOT used on API data. The Laravel backend returns
 *           display-ready dates; tables and show views render them as-is.
 *           It remains available for client-generated dates only.
 */

let activeLocale = "en";

export function setFormatLocale(locale: string): void {
  activeLocale = locale;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(activeLocale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat(activeLocale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(activeLocale, { maximumFractionDigits: 0 }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(activeLocale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatTimeAgo(timestamp: number): string {
  const rtf = new Intl.RelativeTimeFormat(activeLocale, { numeric: "auto" });
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const abs = Math.abs(seconds);

  if (abs < 60) return rtf.format(seconds, "second");
  const minutes = Math.round(seconds / 60);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  return rtf.format(Math.round(days / 7), "week");
}

export const minutesAgo = (minutes: number): number => Date.now() - minutes * 60_000;
