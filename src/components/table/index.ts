/** Public API of the table module. */
export { DataTable, type DataTableProps } from "@/components/table/DataTable";
export { column, ColumnBuilder, normalizeColumns, type ColumnInput } from "@/components/table/columns";
export { useDataTable } from "@/components/table/useDataTable";
export type {
  ActionTone,
  Align,
  BadgeTone,
  BaseFilter,
  Tone,
  BulkAction,
  ColumnDef,
  ColumnType,
  FilterDef,
  FilterOption,
  PrimaryAction,
  RowAction,
  SortState,
} from "@/components/table/types";
