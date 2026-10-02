import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import type { ActionTone, BadgeTone, Tone } from "@/lib/tones";

/** Re-export the global tone types so the table API surface stays unchanged. */
export type { BadgeTone, ActionTone, Tone };

/**
 * Table contracts.
 *
 * Pages never build markup — they declare *what* to show with column
 * builders (see `columns.ts`) and the DataTable decides *how* to render it.
 */

export type Align = "start" | "center" | "end";
export type Breakpoint = "sm" | "md" | "lg" | "xl";


export type ColumnType =
  | "text"
  | "badge"
  | "currency"
  | "number"
  | "date"
  | "avatar"
  | "boolean"
  /** Interactive switch — flips a boolean straight from the cell. */
  | "toggle"
  | "custom";

export interface ColumnDef<T> {
  key: string;
  type: ColumnType;
  /** Literal label (use `labelKey` for i18n). */
  label?: string;
  /** i18n key resolved with `t()`. */
  labelKey?: string;
  accessor: (row: T) => unknown;
  sortable?: boolean;
  searchable?: boolean;
  align?: Align;
  width?: string;
  /** Hide the column below this breakpoint (responsive tables). */
  hideBelow?: Breakpoint;
  /** Allow the user to toggle visibility from the columns menu. */
  toggleable?: boolean;
  defaultHidden?: boolean;
  /** Secondary line rendered under the main value. */
  description?: (row: T) => string | undefined;
  /** Full custom cell. */
  render?: (row: T) => ReactNode;
  /** badge: map raw value → colour tone. */
  tones?: Record<string, BadgeTone>;
  /**
   * badge: resolve the tone from the row itself — for APIs that send a tone
   * per record (e.g. activity logs' `event_type.color`). Wins over `tones`.
   */
  tone?: (row: T) => BadgeTone;
  /** badge/text: translate the raw value for display. */
  formatValue?: (value: string) => string;
  /** avatar: optional image URL (falls back to initials). */
  image?: (row: T) => string | undefined;
  /** Custom comparator, overrides the default one. */
  sortFn?: (a: T, b: T) => number;
  /**
   * toggle: called when the switch is flipped. Pair it with the table's
   * `refreshKey` so the row reflects the server's answer.
   */
  onToggle?: (row: T) => void | Promise<void>;
  /** toggle: hide the switch (still renders the state read-only). */
  toggleDisabled?: (row: T) => boolean;
  cellClass?: string;
}

export interface SortState {
  key: string;
  direction: "asc" | "desc";
}

export interface FilterOption {
  value: string;
  label: string;
}

/** Live value of a filter: scalar for single selects, array for multiple. */
export type FilterValue = string | string[];

/**
 * A filter the page pins on every request (scoping, not user-editable).
 * Example: only this user's activity → { key: "causer_id", value: "14" }.
 * Rendered nowhere; merged into the advanceSearchFilter payload.
 */
export interface BaseFilter {
  key: string;
  value: FilterValue;
  filterType?: string;
  filterStrategy?: string;
}

export interface FilterDef<T> {
  key: string;
  label?: string;
  labelKey?: string;
  /**
   * FilterType enum value for this filter's DTO entry — must be registered
   * in the backend's FilterRegistry. Default: "normal".
   */
  filterType?: string;
  /**
   * FilterStrategy (operator) for this filter's DTO entry — e.g. eq, like,
   * gt, between. Default: "eq".
   */
  filterStrategy?: string;
  /**
   * Render a multi-select control and send the value as an ARRAY
   * (`value[]`) — use with the backend's `multiple-select` handler, which
   * wraps with `whereIn`, e.g. relation pivots like `roles.id`.
   */
  multiple?: boolean;
  /** Static options — a builder (server mode) may provide them instead. */
  options?: FilterOption[];
  accessor: (row: T) => unknown;
  /** Placeholder shown for the "no filter" entry. */
  allLabel?: string;
  /**
   * Server mode only: key in the `{resource}/builder` response that provides
   * this filter's options (defaults to `key` when omitted).
   */
  builderKey?: string;
  /**
   * Map builder items of ANY shape onto option values/labels —
   * e.g. { value: "id", label: "product_name" }. Labels arrive
   * already translated from the backend.
   */
  optionKeys?: { value?: string; label?: string };
}

export interface RowAction<T> {
  id: string;
  label?: string;
  labelKey?: string;
  icon?: LucideIcon;
  onClick: (row: T) => void;
  /** Semantic tone: default | primary | secondary | success | warning | danger | info. */
  tone?: ActionTone;
  hidden?: (row: T) => boolean;
  /** Hidden unless the user holds this permission. */
  permission?: string;
}

export interface BulkAction<T> {
  id: string;
  label?: string;
  labelKey?: string;
  icon?: LucideIcon;
  onClick: (rows: T[]) => void;
  /** Semantic tone: default | primary | secondary | success | warning | danger | info. */
  tone?: ActionTone;
  /** Hidden unless the user holds this permission. */
  permission?: string;
}

export interface PrimaryAction {
  label?: string;
  labelKey?: string;
  icon?: LucideIcon;
  onClick: () => void;
  /** Hidden unless the user holds this permission. */
  permission?: string;
}
