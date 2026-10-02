import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { TONE_CLASS } from "@/lib/tones";
import { formatCurrency, formatNumber } from "@/lib/format";
import { cn } from "@/utils/cn";
import type { ShowEntry } from "./types";

type Translate = (key: string, params?: Record<string, string | number>) => string;

/**
 * Renders one entry's value according to its declared type.
 * Dates arrive formatted from the backend and render as-is.
 */
export function renderShowValue<T extends Record<string, unknown>>({
  entry,
  record,
  t,
}: {
  entry: ShowEntry<T>;
  record: T;
  t: Translate;
}): ReactNode {
  if (entry.render) return entry.render(record);

  const raw = entry.accessor ? entry.accessor(record) : record[entry.key];

  if (raw === null || raw === undefined || raw === "") {
    return <span className="text-slate-300 dark:text-slate-600">—</span>;
  }

  switch (entry.type) {
    case "badge": {
      const value = String(raw);
      const tone = entry.tones?.[value] ?? "default";
      return (
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
            TONE_CLASS[tone],
          )}
        >
          <span className="size-1.5 rounded-full bg-current opacity-70" />
          {entry.formatValue ? entry.formatValue(value) : value}
        </span>
      );
    }

    case "badges": {
      const items = Array.isArray(raw) ? raw : [raw];
      if (items.length === 0) return <span className="text-slate-300">—</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => {
            const value =
              typeof item === "object" && item
                ? String((item as Record<string, unknown>).name ?? "")
                : String(item);
            const tone = entry.tones?.[value] ?? "primary";
            return (
              <span
                key={value}
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ring-inset",
                  TONE_CLASS[tone],
                )}
              >
                {entry.formatValue ? entry.formatValue(value) : value}
              </span>
            );
          })}
        </div>
      );
    }

    case "boolean":
      return raw ? (
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
          <Check className="size-4" /> {t("show.yes")}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400">
          <X className="size-4" /> {t("show.no")}
        </span>
      );

    case "currency":
      return <span className="font-semibold tabular-nums">{formatCurrency(Number(raw))}</span>;

    case "number":
      return <span className="font-semibold tabular-nums">{formatNumber(Number(raw))}</span>;

    default:
      return String(raw);
  }
}
