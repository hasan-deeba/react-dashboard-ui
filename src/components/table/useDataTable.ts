import { useEffect, useMemo, useState } from "react";
import type { ColumnDef, FilterDef, FilterValue, SortState } from "@/components/table/types";

/** Generic comparator: numbers, dates, then locale-aware strings. */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);

  const as = String(a);
  const bs = String(b);
  const ad = Date.parse(as);
  const bd = Date.parse(bs);
  if (!Number.isNaN(ad) && !Number.isNaN(bd)) return ad - bd;
  return as.localeCompare(bs);
}

/** Is a filter value active? (defined, non-empty string, non-empty array) */
function hasSelection(value: FilterValue | undefined): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value !== "";
  return value.length > 0;
}

interface UseDataTableOptions<T> {
  data: T[];
  columns: ColumnDef<T>[];
  filters?: FilterDef<T>[];
  getRowId: (row: T) => string;
  pageSize?: number;
  initialSort?: SortState;
}

/**
 * Headless table state: search → filter → sort → paginate, plus row
 * selection and column visibility. No markup, fully testable.
 * Filter values support multi-select (string[]).
 */
export function useDataTable<T>({
  data,
  columns,
  filters = [],
  getRowId,
  pageSize: initialPageSize = 10,
  initialSort,
}: UseDataTableOptions<T>) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
  const [filterValues, setFilterValues] = useState<Record<string, FilterValue>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(() => new Set());
  const [hiddenKeys, setHiddenKeys] = useState<ReadonlySet<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden).map((c) => c.key)),
  );

  /* --------------------------------- search -------------------------------- */
  const searched = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    const searchable = columns.filter((c) => c.searchable);
    if (searchable.length === 0) return data;
    return data.filter((row) =>
      searchable.some((col) => String(col.accessor(row) ?? "").toLowerCase().includes(q)),
    );
  }, [data, columns, query]);

  /* --------------------------------- filter -------------------------------- */
  const filtered = useMemo(() => {
    const active = Object.entries(filterValues).filter(([, value]) => hasSelection(value));
    if (active.length === 0) return searched;
    return searched.filter((row) =>
      active.every(([key, value]) => {
        const filter = filters.find((f) => f.key === key);
        if (!filter) return true;
        const rowValue = String(filter.accessor(row) ?? "");
        // Multi-select: row matches when its value is among the selections.
        if (Array.isArray(value)) return value.includes(rowValue);
        return rowValue === value;
      }),
    );
  }, [searched, filterValues, filters]);

  /* ---------------------------------- sort --------------------------------- */
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const factor = sort.direction === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) =>
      col.sortFn ? col.sortFn(a, b) * factor : compareValues(col.accessor(a), col.accessor(b)) * factor,
    );
  }, [filtered, sort, columns]);

  /* -------------------------------- paginate ------------------------------- */
  const total = sorted.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  const rows = useMemo(
    () => sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [sorted, currentPage, pageSize],
  );

  // Any change to the result set sends the user back to page 1.
  useEffect(() => {
    setPage(1);
  }, [query, filterValues, pageSize]);

  /* -------------------------------- selection ------------------------------ */
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
    () => data.filter((row) => selectedIds.has(getRowId(row))),
    [data, selectedIds, getRowId],
  );

  /* ------------------------------ column visibility ------------------------ */
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

  /* --------------------------------- sorting ------------------------------- */
  const toggleSort = (key: string) =>
    setSort((prev) => {
      if (prev?.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null; // third click clears sorting
    });

  const setFilter = (key: string, value: FilterValue) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));

  const resetFilters = () => {
    setFilterValues({});
    setQuery("");
  };

  const hasActiveFilters =
    query.trim() !== "" || Object.values(filterValues).some(hasSelection);

  return {
    // data
    rows,
    allFilteredRows: sorted,
    total,
    // search & filters
    query,
    setQuery,
    filterValues,
    setFilter,
    resetFilters,
    hasActiveFilters,
    // sorting
    sort,
    toggleSort,
    // pagination
    page: currentPage,
    pageCount,
    pageSize,
    setPage,
    setPageSize,
    from: total === 0 ? 0 : (currentPage - 1) * pageSize + 1,
    to: Math.min(currentPage * pageSize, total),
    // selection
    selectedIds,
    selectedRows,
    toggleRow,
    toggleAllOnPage,
    allOnPageSelected,
    clearSelection,
    // columns
    visibleColumns,
    hiddenKeys,
    toggleColumn,
  };
}
