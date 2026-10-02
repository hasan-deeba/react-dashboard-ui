import { useEffect, useMemo, useState } from "react";
import { buildIndexParams, listResource, type TableMeta } from "@/services/resources";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type {
  BaseFilter,
  ColumnDef,
  FilterDef,
  FilterValue,
  SortState,
} from "@/components/table/types";

/** Is a filter value active? (defined, non-empty string, non-empty array) */
function hasSelection(value: FilterValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value !== "";
  return value.length > 0;
}

interface UseServerResourceOptions<T> {
  /** Laravel resource path (e.g. "users"). Empty string disables fetching. */
  resource: string;
  columns: ColumnDef<T>[];
  getRowId: (row: T) => string;
  pageSize?: number;
  initialSort?: SortState;
  /**
   * Filter definitions — forwarded to `buildIndexParams` so each active
   * filter is serialized with its operator (advanceSearchFilter DTOs).
   */
  filters?: FilterDef<T>[];
  /** Always-applied scoping filters (not shown in the toolbar). */
  baseFilters?: BaseFilter[];
  /** Bump to force a refetch (e.g. after a mutation outside the table). */
  refreshKey?: number;
}

/**
 * Server-driven table controller — mirrors the `useDataTable` return shape
 * but lets the Laravel API do search / filter / sort / pagination.
 * Filter values support multi-select (string[]).
 */
export function useServerResource<T>({
  resource,
  columns,
  getRowId,
  pageSize: initialPageSize = 10,
  initialSort,
  filters = [],
  baseFilters = [],
  refreshKey = 0,
}: UseServerResourceOptions<T>) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim(), 350);
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const [rows, setRows] = useState<T[]>([]);
  const [meta, setMeta] = useState<TableMeta>({
    total: 0,
    perPage: initialPageSize,
    currentPage: 1,
    lastPage: 1,
    from: 0,
    to: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  // New criteria → back to page 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, filterValues, pageSize]);

  // Fetch the index page from Laravel whenever any criterion changes.
  useEffect(() => {
    if (!resource) return;
    let cancelled = false;

    setLoading(true);
    setError(null);

    listResource<T>(
      resource,
      buildIndexParams({
        page,
        pageSize,
        query: debouncedQuery,
        sort,
        // Scoping filters first; a user selection with the same key wins.
        filters: {
          ...Object.fromEntries(baseFilters.map((f) => [f.key, f.value])),
          ...filterValues,
        },
        filterDefs: [...baseFilters, ...filters],
      }),
    )
      .then((result) => {
        if (cancelled) return;
        setRows(result.rows);
        setMeta(result.meta);
        setLoading(false);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setRows([]);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource, page, pageSize, debouncedQuery, sort, filterValues, reloadKey, refreshKey]);

  /* ------------------------------ sorting ------------------------------ */
  const toggleSort = (key: string) =>
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });

  const setFilter = (key: string, value: FilterValue) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilterValues({});
    setQuery("");
  };

  const hasActiveFilters =
    query.trim() !== "" || Object.values(filterValues).some(hasSelection);

  /* ----------------------------- selection ----------------------------- */
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const pageIds = rows.map(getRowId);
  const allOnPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleRow = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleAllOnPage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageIds.forEach((id) => next.delete(id));
      else pageIds.forEach((id) => next.add(id));
      return next;
    });

  const clearSelection = () => setSelectedIds(new Set());
  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(getRowId(row))),
    [rows, selectedIds, getRowId],
  );

  /* -------------------------- column visibility ------------------------ */
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );
  const toggleColumn = (key: string) =>
    setHiddenKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  const visibleColumns = useMemo(
    () => columns.filter((c) => !hiddenKeys.has(c.key)),
    [columns, hiddenKeys],
  );

  return {
    // data (identical names to useDataTable)
    rows,
    allFilteredRows: rows,
    total: meta.total,
    query,
    setQuery,
    filterValues,
    setFilter,
    resetFilters,
    hasActiveFilters,
    sort,
    toggleSort,
    page,
    pageCount: meta.lastPage,
    pageSize,
    setPage,
    setPageSize,
    from: meta.from,
    to: meta.to,
    selectedIds,
    selectedRows,
    toggleRow,
    toggleAllOnPage,
    allOnPageSelected,
    clearSelection,
    visibleColumns,
    hiddenKeys,
    toggleColumn,
    // server extras
    loading,
    error,
    retry: () => setReloadKey((k) => k + 1),
  };
}
