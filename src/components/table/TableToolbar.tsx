import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Columns3, Download, Plus, Search, SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { MultiSelect } from "@/components/form/inputs/MultiSelect";
import { cn } from "@/utils/cn";
import { InlineSelect } from "@/components/table/InlineSelect";
import type { ColumnDef, FilterDef, FilterValue, PrimaryAction } from "@/components/table/types";

interface TableToolbarProps<T> {
  query: string;
  onQueryChange: (value: string) => void;
  searchable: boolean;
  filters: FilterDef<T>[];
  filterValues: Record<string, FilterValue>;
  onFilterChange: (key: string, value: FilterValue) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  columns: ColumnDef<T>[];
  hiddenKeys: ReadonlySet<string>;
  onToggleColumn: (key: string) => void;
  onExport?: () => void;
  primaryAction?: PrimaryAction;
  label: (def: { label?: string; labelKey?: string; key: string }) => string;
}

export function TableToolbar<T>({
  query,
  onQueryChange,
  searchable,
  filters,
  filterValues,
  onFilterChange,
  hasActiveFilters,
  onResetFilters,
  columns,
  hiddenKeys,
  onToggleColumn,
  onExport,
  primaryAction,
  label,
}: TableToolbarProps<T>) {
  const { t } = useLanguage();
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useClickOutside<HTMLDivElement>(() => setColumnsOpen(false));
  const toggleableColumns = columns.filter((c) => c.toggleable);

  return (
    <div className="flex flex-wrap items-start gap-2 p-4 sm:px-5">
      {/* Search */}
      {searchable && (
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t("table.search")}
            className={cn(
              "w-full rounded-control border border-slate-200 bg-slate-50/80 py-2 pe-8 ps-9 text-sm outline-none transition-all",
              "focus:border-brand-500/50 focus:bg-white focus:ring-4 focus:ring-brand-500/10",
              "dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-900",
            )}
          />
          {query && (
            <button
              type="button"
              aria-label={t("table.clear")}
              onClick={() => onQueryChange("")}
              className="absolute end-2 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Filters — single select, or multi-select for `multiple: true` */}
      {filters.map((filter) => {
        if (filter.multiple) {
          const selections = Array.isArray(filterValues[filter.key])
            ? (filterValues[filter.key] as string[])
            : [];
          return (
            <div key={filter.key} className="w-full min-w-52 max-w-64 sm:w-auto">
              <MultiSelect
                options={filter.options ?? []}
                value={selections}
                onChange={(values) => onFilterChange(filter.key, values)}
                placeholder={filter.allLabel ?? label(filter)}
                searchThreshold={5}
              />
            </div>
          );
        }

        return (
          <InlineSelect
            key={filter.key}
            options={filter.options ?? []}
            value={(filterValues[filter.key] as string) ?? ""}
            allLabel={filter.allLabel ?? label(filter)}
            active={typeof filterValues[filter.key] === "string" && filterValues[filter.key] !== ""}
            onChange={(value) => onFilterChange(filter.key, value)}
          />
        );
      })}

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onResetFilters}
          className="flex items-center gap-1.5 rounded-control px-2.5 py-2 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <SlidersHorizontal className="size-3.5" />
          {t("table.reset")}
        </button>
      )}

      <div className="flex-1" />

      {/* Column visibility */}
      {toggleableColumns.length > 0 && (
        <div ref={columnsRef} className="relative">
          <button
            type="button"
            onClick={() => setColumnsOpen((prev) => !prev)}
            className="flex items-center gap-1.5 rounded-control border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Columns3 className="size-3.5" />
            <span className="hidden sm:inline">{t("table.columns")}</span>
          </button>
          <AnimatePresence>
            {columnsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute end-0 top-full z-40 mt-2 w-52 origin-top overflow-hidden rounded-card border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
              >
                {toggleableColumns.map((col) => {
                  const visible = !hiddenKeys.has(col.key);
                  return (
                    <button
                      key={col.key}
                      type="button"
                      onClick={() => onToggleColumn(col.key)}
                      className="flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-start text-sm text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded border",
                          visible
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300 dark:border-slate-600",
                        )}
                      >
                        {visible && <Check className="size-3" />}
                      </span>
                      <span className="truncate">{label(col)}</span>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Export */}
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-control border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Download className="size-3.5" />
          <span className="hidden sm:inline">{t("table.export")}</span>
        </button>
      )}

      {/* Primary action */}
      {primaryAction && (
        <button
          type="button"
          onClick={primaryAction.onClick}
          className="flex items-center gap-1.5 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          {primaryAction.icon ? <primaryAction.icon className="size-3.5" /> : <Plus className="size-3.5" />}
          {primaryAction.labelKey ? t(primaryAction.labelKey) : primaryAction.label}
        </button>
      )}
    </div>
  );
}
