import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Check,
  GripVertical,
  Inbox,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatNumber } from "@/lib/format";
import {
  buildIndexParams,
  exportResource,
  getBuilderRaw,
  reorderResource,
  toOptions,
} from "@/services/resources";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { Switch } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { Skeleton } from "@/components/ui/Loading";
import { cn } from "@/utils/cn";
import { ACTION_TONE_CLASS, BULK_ACTION_TONE_CLASS, TONE_CLASS } from "@/lib/tones";
import { normalizeColumns, type ColumnInput } from "@/components/table/columns";
import { TablePagination } from "@/components/table/TablePagination";
import { TableToolbar } from "@/components/table/TableToolbar";
import { useDataTable } from "@/components/table/useDataTable";
import { useServerResource } from "@/components/table/useServerResource";
import type {
  Align,
  BaseFilter,
  BulkAction,
  ColumnDef,
  FilterDef,
  PrimaryAction,
  RowAction,
  SortState,
} from "@/components/table/types";

const ALIGN_CLASS: Record<Align, string> = {
  start: "text-start",
  center: "text-center",
  end: "text-end",
};

const HIDE_BELOW_CLASS: Record<string, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
};

/* -------------------------------- row actions ------------------------------ */

/**
 * Inline icon actions with hover tooltips.
 * Actions without an icon fall back to a compact text button.
 */
function RowActions<T>({ row, actions }: { row: T; actions: RowAction<T>[] }) {
  const { t } = useLanguage();
  const visible = actions.filter((action) => !action.hidden?.(row));
  if (visible.length === 0) return null;

  return (
    <div className="flex items-center justify-end gap-1">
      {visible.map((action) => {
        const label = action.labelKey ? t(action.labelKey) : (action.label ?? action.id);
        const Icon = action.icon;

        return (
          <div key={action.id} className="group/action relative">
            <button
              type="button"
              aria-label={label}
              onClick={() => action.onClick(row)}
              className={cn(
                "grid size-8 place-items-center rounded-control transition-colors",
                ACTION_TONE_CLASS[action.tone ?? "default"],
              )}
            >
              {Icon ? <Icon className="size-4" /> : <span className="text-xs font-bold">{label.charAt(0)}</span>}
            </button>

            {/* Tooltip */}
            <span
              role="tooltip"
              className={cn(
                "pointer-events-none absolute -top-8 left-1/2 z-40 -translate-x-1/2 whitespace-nowrap",
                "rounded-md bg-slate-900 px-2 py-1 text-[11px] font-semibold text-white shadow-lg",
                "opacity-0 transition-opacity duration-150 group-hover/action:opacity-100",
                "dark:bg-slate-700",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* --------------------------------- checkbox -------------------------------- */

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={cn(
        "grid size-[18px] shrink-0 place-items-center rounded-[5px] border transition-colors",
        checked
          ? "border-brand-600 bg-brand-600 text-white"
          : "border-slate-300 hover:border-brand-500 dark:border-slate-600",
      )}
    >
      {checked && <Check className="size-3" strokeWidth={3} />}
    </button>
  );
}

/* ---------------------------------- props ---------------------------------- */

export interface DataTableProps<T> {
  /** Client mode payload (ignored in server mode). */
  data?: T[];
  /**
   * Server mode: Laravel resource path (e.g. "users"). The table fetches
   * `GET {resource}` for rows and `GET {resource}/builder` for filter options.
   */
  resource?: string;
  columns: ColumnInput<T>[];
  getRowId: (row: T) => string;
  title?: string;
  titleKey?: string;
  description?: string;
  descriptionKey?: string;
  filters?: FilterDef<T>[];
  /** Always-applied scoping filters, e.g. only this user's activity. */
  baseFilters?: BaseFilter[];
  rowActions?: RowAction<T>[];
  bulkActions?: BulkAction<T>[];
  primaryAction?: PrimaryAction;
  searchable?: boolean;
  selectable?: boolean;
  exportable?: boolean;
  /**
   * "client" (default) builds a CSV from the rows on screen.
   * "server" calls `GET {resource}/export` with the SAME filters and saves
   *  the file the backend returns (CrudService::export → .xlsx).
   */
  exportMode?: "client" | "server";
  exportFileName?: string;
  loading?: boolean;
  /** Bump to force a server-mode refetch (e.g. after deleting a record). */
  refreshKey?: number;
  /**
   * Enable drag-and-drop row ordering. Adds a handle column and, on drop,
   * persists `POST {resource}/reorder` with `[{ id, sort_order }]`.
   * Requires a `sort_order` column on the model.
   */
  reorderable?: boolean;
  /** Override the persistence step (defaults to `reorderResource`). */
  onReorder?: (rows: T[]) => void | Promise<void>;
  pageSize?: number;
  initialSort?: SortState;
  onRowClick?: (row: T) => void;
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
}

/**
 * Declarative, fully-featured table — client data, or a Laravel `resource`.
 *
 *   <DataTable data={users} … />            // client mode
 *   <DataTable resource="users" … />        // server mode (index + builder)
 *
 * Dates arrive formatted from the backend and render as-is.
 */
export function DataTable<T>({
  data = [],
  resource,
  columns,
  getRowId,
  title,
  titleKey,
  description,
  descriptionKey,
  filters = [],
  baseFilters,
  rowActions = [],
  bulkActions = [],
  primaryAction,
  searchable = true,
  selectable = false,
  exportable = false,
  exportMode = "client",
  exportFileName,
  loading: loadingProp = false,
  refreshKey,
  reorderable = false,
  onReorder,
  pageSize = 10,
  initialSort,
  onRowClick,
  emptyIcon: EmptyIcon = Inbox,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  const { t } = useLanguage();
  const { can } = useAuth();
  const toast = useToast();
  const defs = useMemo(() => normalizeColumns(columns), [columns]);
  const serverMode = Boolean(resource);

  /* Permission filtering — actions the user can't perform never render. */
  const allowedRowActions = useMemo(
    () => rowActions.filter((action) => can(action.permission)),
    [rowActions, can],
  );
  const allowedBulkActions = useMemo(
    () => bulkActions.filter((action) => can(action.permission)),
    [bulkActions, can],
  );
  const allowedPrimaryAction =
    primaryAction && can(primaryAction.permission) ? primaryAction : undefined;

  /* ------ builder (server mode): filter options from {resource}/builder ------ */
  /** Raw builder items per key — normalised per filter via `optionKeys`. */
  const [builderOptions, setBuilderOptions] = useState<Record<string, unknown[]>>({});

  /**
   * Only fetch when a filter actually needs builder options — resources like
   * activity-logs have no /builder route, so an unconditional call 404s.
   */
  const needsBuilder = filters.some(
    (filter) => !filter.options?.length && (filter.builderKey ?? filter.key),
  );

  useEffect(() => {
    if (!resource || !needsBuilder) return;
    let cancelled = false;
    getBuilderRaw(resource)
      .then((options) => {
        if (!cancelled) setBuilderOptions(options);
      })
      .catch(() => {
        /* A missing/failed builder just means fewer filters — never fatal. */
      });
    return () => {
      cancelled = true;
    };
  }, [resource, needsBuilder]);

  const resolvedFilters = useMemo<FilterDef<T>[]>(
    () =>
      filters.map((filter) => ({
        ...filter,
        options:
          filter.options && filter.options.length > 0
            ? filter.options
            : toOptions(builderOptions[filter.builderKey ?? filter.key] ?? [], filter.optionKeys),
      })),
    [filters, builderOptions],
  );

  /* ------------------------ controllers (client vs server) ----------------- */
  const client = useDataTable<T>({
    data,
    columns: defs,
    filters: resolvedFilters,
    getRowId,
    pageSize,
    initialSort,
  });
  const server = useServerResource<T>({
    resource: resource ?? "",
    columns: defs,
    getRowId,
    pageSize,
    initialSort,
    filters: resolvedFilters,
    baseFilters,
    refreshKey,
  });

  const table = serverMode ? server : client;
  const loading = loadingProp || (serverMode && server.loading);
  const error = serverMode ? server.error : null;

  /** Resolve an i18n key or literal label. */
  const label = (def: { label?: string; labelKey?: string; key?: string }): string =>
    def.labelKey ? t(def.labelKey) : (def.label ?? def.key ?? "");

  /** Plain-text value used by CSV export and fallback rendering. */
  const stringify = (col: ColumnDef<T>, row: T): string => {
    const value = col.accessor(row);
    if (value == null) return "";
    switch (col.type) {
      case "currency":
        return formatCurrency(Number(value));
      case "number":
        return formatNumber(Number(value));
      case "badge":
        return col.formatValue ? col.formatValue(String(value)) : String(value);
      default:
        return String(value);
    }
  };

  /** CSV of the rows currently on screen. */
  const exportCsv = () => {
    const header = table.visibleColumns.map((col) => label(col)).join(",");
    const rows = table.allFilteredRows.map((row) =>
      table.visibleColumns.map((col) => `"${stringify(col, row).replace(/"/g, '""')}"`).join(","),
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = exportFileName ?? `${resource ?? "export"}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Ask the backend to export, passing the live search/sort/filters so the
   * file matches what the user is looking at. The backend produces it.
   */
  const exportServer = () => {
    if (!resource) return;
    void exportResource(
      resource,
      buildIndexParams({
        page: 1,
        pageSize: table.total || table.pageSize,
        query: table.query,
        sort: table.sort,
        filters: {
          ...Object.fromEntries((baseFilters ?? []).map((f) => [f.key, f.value])),
          ...table.filterValues,
        },
        filterDefs: [...(baseFilters ?? []), ...resolvedFilters],
      }),
    ).catch(() => undefined);
  };

  const handleExport = exportMode === "server" && serverMode ? exportServer : exportCsv;

  /* ------------------------------- cell render ------------------------------ */
  const renderCell = (col: ColumnDef<T>, row: T): ReactNode => {
    if (col.render) return col.render(row);

    const raw = col.accessor(row);
    const text = stringify(col, row);
    const description = col.description?.(row);

    switch (col.type) {
      case "badge": {
        const tone = col.tone?.(row) ?? col.tones?.[String(raw)] ?? "default";
        return (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
              TONE_CLASS[tone],
            )}
          >
            <span className="size-1.5 rounded-full bg-current opacity-70" />
            {text}
          </span>
        );
      }

      case "avatar": {
        const image = col.image?.(row);
        return (
          <div className="flex items-center gap-3">
            {image ? (
              <img
                src={image}
                alt=""
                className="size-9 shrink-0 rounded-full object-cover ring-2 ring-brand-500/30"
              />
            ) : (
              <InitialsAvatar name={text} className="size-9 text-xs" />
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800 dark:text-slate-100">{text}</p>
              {description && (
                <p className="truncate text-xs text-slate-400 dark:text-slate-500">{description}</p>
              )}
            </div>
          </div>
        );
      }

      case "boolean":
        return raw ? (
          <Check className="size-4 text-emerald-500" />
        ) : (
          <X className="size-4 text-slate-300 dark:text-slate-600" />
        );

      case "toggle":
        // Flips straight from the cell; stop propagation so a row click
        // (navigate to detail) doesn't fire at the same time.
        return (
          <span
            className="inline-flex"
            onClick={(event) => event.stopPropagation()}
            role="presentation"
          >
            <Switch
              checked={Boolean(raw)}
              disabled={col.toggleDisabled?.(row) ?? !col.onToggle}
              label={label(col)}
              onChange={() => void col.onToggle?.(row)}
            />
          </span>
        );

      case "currency":
      case "number":
        return <span className="font-semibold tabular-nums">{text}</span>;

      default:
        return (
          <div className="min-w-0">
            <p className="truncate">{text}</p>
            {description && (
              <p className="truncate text-xs text-slate-400 dark:text-slate-500">{description}</p>
            )}
          </div>
        );
    }
  };

  /* ------------------------------- reordering ------------------------------ */
  /**
   * Rows are mirrored locally while dragging so the move is instant; on drop
   * we persist the new `sort_order` and let the table refetch.
   */
  const [draftRows, setDraftRows] = useState<T[] | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const displayRows = draftRows ?? table.rows;

  const moveRow = (from: number, to: number) => {
    if (from === to) return;
    const next = [...displayRows];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setDraftRows(next);
  };

  const commitOrder = () => {
    setDragIndex(null);
    if (!draftRows) return;

    const ordered = draftRows;

    const persist =
      onReorder ??
      ((rows: T[]) =>
        resource
          ? reorderResource(
              resource,
              rows.map((row, index) => ({ id: getRowId(row), sort_order: index + 1 })),
            )
          : Promise.resolve());

    void Promise.resolve(persist(ordered))
      .then(() => {
        toast.success(t("table.reorderSuccess"));
        // Keep the dragged order on screen; the next fetch confirms it.
        setDraftRows(null);
      })
      .catch((error: unknown) => {
        toast.error(error instanceof Error ? error.message : t("table.reorderFailed"));
        // Roll back to the server's order.
        setDraftRows(null);
      });
  };

  const columnCount =
    table.visibleColumns.length +
    (selectable ? 1 : 0) +
    (reorderable ? 1 : 0) +
    (allowedRowActions.length > 0 ? 1 : 0);
  const showEmpty = !loading && !error && table.rows.length === 0;

  return (
    <div className="surface-card relative overflow-visible">
      {/* Heading */}
      {(title || titleKey) && (
        <div className="border-b border-slate-200/70 px-4 pb-3 pt-4 dark:border-slate-800 sm:px-5">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {titleKey ? t(titleKey) : title}
          </h2>
          {(description || descriptionKey) && (
            <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
              {descriptionKey ? t(descriptionKey) : description}
            </p>
          )}
        </div>
      )}

      <TableToolbar
        query={table.query}
        onQueryChange={table.setQuery}
        searchable={searchable}
        filters={resolvedFilters}
        filterValues={table.filterValues}
        onFilterChange={table.setFilter}
        hasActiveFilters={table.hasActiveFilters}
        onResetFilters={table.resetFilters}
        columns={defs}
        hiddenKeys={table.hiddenKeys}
        onToggleColumn={table.toggleColumn}
        onExport={exportable ? handleExport : undefined}
        primaryAction={allowedPrimaryAction}
        label={label}
      />

      {/* Bulk actions bar */}
      <AnimatePresence>
        {selectable && table.selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mx-4 mb-3 flex flex-wrap items-center gap-2 rounded-control bg-brand-500/10 px-3 py-2 sm:mx-5">
              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
                {t("table.selected", { count: table.selectedIds.size })}
              </span>
              <div className="flex-1" />
              {allowedBulkActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => {
                    action.onClick(table.selectedRows);
                    table.clearSelection();
                  }}
                  className={cn(
                    "flex items-center gap-1.5 rounded-control px-2.5 py-1.5 text-xs font-semibold transition-colors",
                    BULK_ACTION_TONE_CLASS[action.tone ?? "default"],
                  )}
                >
                  {action.icon && <action.icon className="size-3.5" />}
                  {action.labelKey ? t(action.labelKey) : action.label}
                </button>
              ))}
              <button
                type="button"
                onClick={table.clearSelection}
                className="grid size-6 place-items-center rounded text-brand-700/70 hover:bg-white/60 dark:text-brand-300"
                aria-label={t("table.clear")}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-y border-slate-200/70 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-800/30">
              {reorderable && <th className="w-8 px-2 py-3 sm:ps-4" aria-hidden />}
              {selectable && (
                <th className="w-10 px-4 py-3 sm:ps-5">
                  <Checkbox
                    checked={table.allOnPageSelected}
                    onChange={table.toggleAllOnPage}
                    label={t("table.selectAll")}
                  />
                </th>
              )}

              {table.visibleColumns.map((col) => {
                const isSorted = table.sort?.key === col.key;
                return (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    className={cn(
                      "whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500",
                      ALIGN_CLASS[col.align ?? "start"],
                      col.hideBelow && HIDE_BELOW_CLASS[col.hideBelow],
                    )}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => table.toggleSort(col.key)}
                        className={cn(
                          "inline-flex items-center gap-1.5 transition-colors hover:text-slate-600 dark:hover:text-slate-300",
                          isSorted && "text-brand-600 dark:text-brand-400",
                        )}
                      >
                        {label(col)}
                        {isSorted ? (
                          table.sort?.direction === "asc" ? (
                            <ArrowUp className="size-3" />
                          ) : (
                            <ArrowDown className="size-3" />
                          )
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      label(col)
                    )}
                  </th>
                );
              })}

              {allowedRowActions.length > 0 && (
                <th className="w-px whitespace-nowrap px-4 py-3 text-end text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:pe-5 dark:text-slate-500">
                  {t("table.actions")}
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {/* Loading skeletons */}
            {loading &&
              Array.from({ length: Math.min(pageSize, 5) }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="border-b border-slate-100 dark:border-slate-800/60">
                  {Array.from({ length: columnCount }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4">
                      <Skeleton className="h-3.5 w-full max-w-[9rem]" />
                    </td>
                  ))}
                </tr>
              ))}

            {/* Rows */}
            {!loading &&
              displayRows.map((row, index) => {
                const id = getRowId(row);
                const selected = table.selectedIds.has(id);
                return (
                  <motion.tr
                    key={id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.2) }}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    draggable={reorderable && dragIndex !== null}
                    onDragStart={() => setDragIndex(index)}
                    onDragOver={(event) => {
                      if (dragIndex === null) return;
                      event.preventDefault();
                      if (dragIndex !== index) {
                        moveRow(dragIndex, index);
                        setDragIndex(index);
                      }
                    }}
                    onDragEnd={commitOrder}
                    onDrop={commitOrder}
                    className={cn(
                      "border-b border-slate-100 transition-colors last:border-0 dark:border-slate-800/60",
                      selected
                        ? "bg-brand-500/[0.06]"
                        : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40",
                      onRowClick && "cursor-pointer",
                      dragIndex === index && "bg-brand-500/10 opacity-80",
                    )}
                  >
                    {reorderable && (
                      <td
                        className="w-8 px-2 py-3 sm:ps-4"
                        onClick={(e) => e.stopPropagation()}
                        // Dragging starts from the handle only, so normal
                        // text selection inside cells still works.
                        onMouseDown={() => setDragIndex(index)}
                        onMouseUp={() => setDragIndex(null)}
                      >
                        <span
                          role="button"
                          aria-label={t("table.reorder")}
                          className="grid size-6 cursor-grab place-items-center rounded text-slate-300 transition-colors hover:text-slate-500 active:cursor-grabbing dark:text-slate-600 dark:hover:text-slate-400"
                        >
                          <GripVertical className="size-4" />
                        </span>
                      </td>
                    )}

                    {selectable && (
                      <td className="px-4 py-3 sm:ps-5" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected}
                          onChange={() => table.toggleRow(id)}
                          label={t("table.selectRow")}
                        />
                      </td>
                    )}

                    {table.visibleColumns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-slate-600 dark:text-slate-300",
                          ALIGN_CLASS[col.align ?? "start"],
                          col.hideBelow && HIDE_BELOW_CLASS[col.hideBelow],
                          col.cellClass,
                        )}
                      >
                        {renderCell(col, row)}
                      </td>
                    ))}

                    {allowedRowActions.length > 0 && (
                      <td className="px-4 py-3 sm:pe-5" onClick={(e) => e.stopPropagation()}>
                        <RowActions row={row} actions={allowedRowActions} />
                      </td>
                    )}
                  </motion.tr>
                );
              })}

            {/* Error state (server mode) */}
            {error && !loading && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-14">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="grid size-14 place-items-center rounded-icon bg-rose-500/10 text-rose-500">
                      <AlertTriangle className="size-6" />
                    </span>
                    <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {t("table.errorTitle")}
                    </p>
                    <p dir="auto" className="max-w-xs text-xs text-slate-400 dark:text-slate-500">
                      {error.message}
                    </p>
                    {serverMode && (
                      <button
                        type="button"
                        onClick={server.retry}
                        className="mt-2 rounded-control bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
                      >
                        {t("table.retry")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state */}
            {showEmpty && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-16">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="grid size-14 place-items-center rounded-icon bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                      <EmptyIcon className="size-6" />
                    </span>
                    <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {emptyTitle ?? t("table.emptyTitle")}
                    </p>
                    <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
                      {table.hasActiveFilters
                        ? t("table.emptyFiltered")
                        : (emptyDescription ?? t("table.emptyDescription"))}
                    </p>
                    {table.hasActiveFilters && (
                      <button
                        type="button"
                        onClick={table.resetFilters}
                        className="mt-2 rounded-control bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white transition-transform hover:scale-[1.03]"
                      >
                        {t("table.reset")}
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {!loading && !error && table.total > 0 && (
        <TablePagination
          page={table.page}
          pageCount={table.pageCount}
          pageSize={table.pageSize}
          total={table.total}
          from={table.from}
          to={table.to}
          onPage={table.setPage}
          onPageSize={table.setPageSize}
        />
      )}
    </div>
  );
}
