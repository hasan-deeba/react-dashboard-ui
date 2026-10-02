import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { BadgeTone, Tone } from "@/lib/tones";

/** Re-export so show consumers can type tone maps from one place. */
export type { BadgeTone, Tone };

/**
 * Show-view contracts — the declarations a resource provides to describe
 * how its detail page should look.
 */

export type ShowEntryType =
  | "text"
  | "badge"
  | "badges"
  | "boolean"
  | "date"
  | "currency"
  | "number"
  | "custom";

export interface ShowEntry<T> {
  key: string;
  type?: ShowEntryType;
  label?: string;
  labelKey?: string;
  /** Defaults to `record[key]`. */
  accessor?: (record: T) => unknown;
  /** badge/badges: map raw values to global tones. */
  tones?: Record<string, BadgeTone>;
  /** Final display transform on the value. */
  formatValue?: (value: string) => string;
  /** `custom`: the entry paints itself. */
  render?: (record: T) => ReactNode;
  /** Span the full grid width. */
  full?: boolean;
}

export interface ShowSection<T> {
  titleKey?: string;
  title?: string;
  entries: ShowEntry<T>[];
}

/** The data a resource's `header()` returns for the header card. */
export interface ShowHeaderData {
  title: string;
  subtitle?: string;
  /** Record image URL — initials avatar when absent. */
  image?: string | null;
  /** Rendered in a gradient brand well when no image is present. */
  icon?: LucideIcon;
  /** Classes for the icon well (defaults to brand gradient). */
  iconClassName?: string;
}

/** Timestamp fields auto-rendered in the footer (raw, backend-formatted). */
export interface TimestampKeys {
  created?: string;
  updated?: string;
}

export interface DynamicShowProps<T> {
  /** Provide a loaded record… */
  record?: T;
  /** …or let the component fetch `GET {resource}/{recordId}`. */
  resource?: string;
  recordId?: string | number;
  sections: ShowSection<T>[];
  titleKey?: string;
  title?: string;
  /** Header card data resolver (name, subtitle, image/icon). */
  header?: (record: T) => ShowHeaderData;
  /** Extra content beside the main sections — e.g. related users. */
  aside?: (record: T) => ReactNode;
  /** Back button destination (default: the resource index). */
  backPath?: string;
  /** Edit button destination (default: `/{resource}/{id}/edit`). */
  editPath?: (record: T) => string;
  /**
   * Permission required to see the Edit button.
   * Defaults to `{resource}.edit` — pass `null` to always show it.
   */
  editPermission?: string | null;
  /** Auto-render created/updated timestamps in the footer. */
  showTimestamps?: boolean;
  timestampKeys?: TimestampKeys;

  // legacy alias for TSX consumers extending the base record
  children?: ReactNode;
}
