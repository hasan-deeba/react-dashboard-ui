import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { formatNumber } from "@/lib/format";
import { InlineSelect } from "@/components/table/InlineSelect";
import { cn } from "@/utils/cn";

interface TablePaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  from: number;
  to: number;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
  pageSizeOptions?: number[];
}

/** Compact page window: 1 … 4 [5] 6 … 20 */
function buildPages(page: number, pageCount: number): Array<number | "gap"> {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, i) => i + 1);
  const pages: Array<number | "gap"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pageCount - 1, page + 1);
  if (start > 2) pages.push("gap");
  for (let i = start; i <= end; i += 1) pages.push(i);
  if (end < pageCount - 1) pages.push("gap");
  pages.push(pageCount);
  return pages;
}

export function TablePagination({
  page,
  pageCount,
  pageSize,
  total,
  from,
  to,
  onPage,
  onPageSize,
  pageSizeOptions = [10, 25, 50],
}: TablePaginationProps) {
  const { t } = useLanguage();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 px-4 py-3 dark:border-slate-800 sm:px-5">
      <div className="flex items-center gap-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t("table.showing", {
            from: formatNumber(from),
            to: formatNumber(to),
            total: formatNumber(total),
          })}
        </p>
        <InlineSelect
          compact
          value={String(pageSize)}
          options={pageSizeOptions.map((size) => ({
            value: String(size),
            label: t("table.perPageValue", { size }),
          }))}
          onChange={(value) => onPageSize(Number(value))}
        />
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          aria-label={t("table.previous")}
          className="grid size-8 place-items-center rounded-control border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ChevronLeft className="size-4 rtl:-scale-x-100" />
        </button>

        {buildPages(page, pageCount).map((entry, index) =>
          entry === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={entry}
              type="button"
              onClick={() => onPage(entry)}
              aria-current={entry === page ? "page" : undefined}
              className={cn(
                "grid size-8 place-items-center rounded-control text-xs font-semibold tabular-nums transition-colors",
                entry === page
                  ? "bg-gradient-to-r from-brand-600 to-accent-600 text-white shadow-md shadow-brand-600/25"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              {entry}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          aria-label={t("table.next")}
          className="grid size-8 place-items-center rounded-control border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
        >
          <ChevronRight className="size-4 rtl:-scale-x-100" />
        </button>
      </div>
    </div>
  );
}
