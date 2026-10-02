import type { ReactNode } from "react";
import type {
  Align,
  BadgeTone,
  Breakpoint,
  ColumnDef,
  ColumnType,
} from "@/components/table/types";

/**
 * Fluent column builders (Filament-style).
 *
 *   column.text<User>("name").labelKey("resources.users.name").sortable().searchable()
 *   column.badge<User>("status").tones({ active: "success", banned: "danger" })
 *   column.currency<Order>("amount").align("end")
 */

const defaultAccessor =
  <T,>(key: string) =>
  (row: T): unknown =>
    (row as unknown as Record<string, unknown>)[key];

export class ColumnBuilder<T> {
  readonly def: ColumnDef<T>;

  constructor(key: string, type: ColumnType) {
    this.def = { key, type, accessor: defaultAccessor<T>(key) };
  }

  /** Literal label. */
  label(value: string): this {
    this.def.label = value;
    return this;
  }

  /** i18n key, resolved by the table with `t()`. */
  labelKey(value: string): this {
    this.def.labelKey = value;
    return this;
  }

  /** Custom value getter (defaults to `row[key]`). */
  accessor(fn: (row: T) => unknown): this {
    this.def.accessor = fn;
    return this;
  }

  sortable(value = true): this {
    this.def.sortable = value;
    return this;
  }

  searchable(value = true): this {
    this.def.searchable = value;
    return this;
  }

  align(value: Align): this {
    this.def.align = value;
    return this;
  }

  width(value: string): this {
    this.def.width = value;
    return this;
  }

  /** Hide the column below a breakpoint. */
  hideBelow(value: Breakpoint): this {
    this.def.hideBelow = value;
    return this;
  }

  /** Let users show/hide this column from the columns menu. */
  toggleable(defaultHidden = false): this {
    this.def.toggleable = true;
    this.def.defaultHidden = defaultHidden;
    return this;
  }

  /** Secondary muted line under the value. */
  description(fn: (row: T) => string | undefined): this {
    this.def.description = fn;
    return this;
  }

  /** Map raw values to badge colours. */
  tones(map: Record<string, BadgeTone>): this {
    this.def.tones = map;
    return this;
  }

  /** Resolve the badge tone per row (for API-provided colours). */
  tone(fn: (row: T) => BadgeTone): this {
    this.def.tone = fn;
    return this;
  }

  /** Translate/format the raw value for display. */
  formatValue(fn: (value: string) => string): this {
    this.def.formatValue = fn;
    return this;
  }

  /** Avatar image URL (falls back to generated initials). */
  image(fn: (row: T) => string | undefined): this {
    this.def.image = fn;
    return this;
  }

  sortFn(fn: (a: T, b: T) => number): this {
    this.def.sortFn = fn;
    return this;
  }

  /** toggle columns: handler for flipping the switch. */
  onToggle(fn: (row: T) => void | Promise<void>): this {
    this.def.onToggle = fn;
    return this;
  }

  /** toggle columns: render the switch read-only for these rows. */
  toggleDisabled(fn: (row: T) => boolean): this {
    this.def.toggleDisabled = fn;
    return this;
  }

  /** Escape hatch: render whatever you want. */
  render(fn: (row: T) => ReactNode): this {
    this.def.render = fn;
    return this;
  }

  cellClass(value: string): this {
    this.def.cellClass = value;
    return this;
  }
}

const make =
  (type: ColumnType) =>
  <T,>(key: string): ColumnBuilder<T> =>
    new ColumnBuilder<T>(key, type);

export const column = {
  text: make("text"),
  badge: make("badge"),
  currency: make("currency"),
  number: make("number"),
  date: make("date"),
  avatar: make("avatar"),
  boolean: make("boolean"),
  /** Switch cell — flips a boolean in place (e.g. is_active). */
  toggle: make("toggle"),
  custom: make("custom"),
};

export type ColumnInput<T> = ColumnBuilder<T> | ColumnDef<T>;

/** Accept either builders or raw defs. */
export function normalizeColumns<T>(columns: ColumnInput<T>[]): ColumnDef<T>[] {
  return columns.map((c) => (c instanceof ColumnBuilder ? c.def : c));
}
