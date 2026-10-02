/**
 * Laravel resource client (CrudService contract).
 *
 * PURPOSE : translate between the dashboard's generic engines (DataTable,
 *           DynamicForm, DynamicShow) and the backend's REST + ResultService
 *           conventions. Envelopes and paginator shapes are normalised here
 *           so components only ever see rows, meta and plain records.
 * EXPORTS : buildIndexParams(), listResource(), showResource(),
 *           createResource(), updateResource(), deleteResource(),
 *           getBuilderRaw(), clearBuilderCache(), toOptions(), types.
 * EDIT    : this is the ONLY place index query strings and response shapes
 *           are interpreted. If the backend contract changes, change it here
 *           — never in a component.
 *
 * Endpoints
 *   GET    {resource}            index   → item: { items, pageResponse }
 *   GET    {resource}/builder    filters → item: { <group>: [...], ... }
 *   GET    {resource}/{id}       show
 *   POST   {resource}            store
 *   PUT    {resource}/{id}       update
 *   DELETE {resource}/{id}       destroy
 */

import api, { type QueryParams } from "@/services/api";
import type { FilterOption, SortState } from "@/components/table";

export interface TableMeta {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  from: number;
  to: number;
}

export interface IndexResult<T> {
  rows: T[];
  meta: TableMeta;
}

/* --------------------------- index query params --------------------------- */

/**
 * Advanced filters are an ARRAY of FilterDTOs read from
 * `$request->input('advanceSearchFilter')`. These constants mirror
 * FilterDTO::fromArray — change them here if the DTO changes.
 */
const FILTER_PARAM = "advanceSearchFilter";
const FILTER_FIELD_KEY = "key";
const FILTER_TYPE_KEY = "type";
const FILTER_STRATEGY_KEY = "strategy";
const FILTER_VALUE_KEY = "value";
const DEFAULT_FILTER_TYPE = "normal";
const DEFAULT_FILTER_STRATEGY = "eq";

export interface IndexQuery {
  page: number;
  pageSize: number;
  query?: string;
  sort?: SortState | null;
  /** Active values keyed by backend column; arrays for multiple-select. */
  filters?: Record<string, string | string[]>;
  /** Definitions supply each filter's type/strategy. */
  filterDefs?: Array<{ key: string; filterType?: string; filterStrategy?: string }>;
}

export function buildIndexParams({
  page,
  pageSize,
  query,
  sort,
  filters = {},
  filterDefs = [],
}: IndexQuery): QueryParams {
  const params: QueryParams = { page, per_page: pageSize };

  if (query) params.search = query;

  if (sort) {
    params.sort = sort.key;
    params.direction = sort.direction;
  }

  let index = 0;
  for (const [key, value] of Object.entries(filters)) {
    if (value === "" || value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    const def = filterDefs.find((d) => d.key === key);
    params[`${FILTER_PARAM}[${index}][${FILTER_FIELD_KEY}]`] = key;
    params[`${FILTER_PARAM}[${index}][${FILTER_VALUE_KEY}]`] = value;
    params[`${FILTER_PARAM}[${index}][${FILTER_TYPE_KEY}]`] =
      def?.filterType ?? DEFAULT_FILTER_TYPE;
    params[`${FILTER_PARAM}[${index}][${FILTER_STRATEGY_KEY}]`] =
      def?.filterStrategy ?? DEFAULT_FILTER_STRATEGY;
    index += 1;
  }

  return params;
}

/* --------------------------------- options -------------------------------- */

/** Maps a builder item of any shape onto a select option. */
export interface OptionKeys {
  value?: string;
  label?: string;
}

const VALUE_CHAIN = ["value", "id", "key", "name"];
const LABEL_CHAIN = ["label", "name", "value"];

function pick(obj: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    const candidate = obj[key];
    if (candidate !== undefined && candidate !== null && candidate !== "") return candidate;
  }
  return undefined;
}

/**
 * Normalise builder items into `{ value, label }`.
 * Accepts ["admin"], [{value,label}], [{id,name}] or any custom pair via
 * `keys` (e.g. { value: "id", label: "product_name" }).
 * Labels arrive already translated from Laravel — never re-translate them.
 */
export function toOptions(raw: unknown, keys?: OptionKeys): FilterOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item): FilterOption | null => {
      if (typeof item === "string" || typeof item === "number") {
        return { value: String(item), label: String(item) };
      }
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        const value = String(
          pick(obj, keys?.value ? [keys.value, ...VALUE_CHAIN] : VALUE_CHAIN) ?? "",
        );
        const label = String(
          pick(obj, keys?.label ? [keys.label, ...LABEL_CHAIN] : LABEL_CHAIN) ?? value,
        );
        return { value, label };
      }
      return null;
    })
    .filter((o): o is FilterOption => o !== null && o.value !== "");
}

/* ------------------------------- normalisers ------------------------------ */

/** Unwrap single-record envelopes: ResultService `item`, resource `data`. */
function unwrapEnvelope<T>(raw: T): T {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    const obj = raw as Record<string, unknown>;
    const inner = obj.item ?? obj.data ?? obj.result;
    if (inner && typeof inner === "object" && !Array.isArray(inner)) {
      return inner as T;
    }
  }
  return raw;
}

function normalizeIndex<T>(raw: unknown): IndexResult<T> {
  const payload = unwrapEnvelope(raw);

  let rows: T[] = [];
  let meta: Record<string, unknown> = {};

  if (Array.isArray(payload)) {
    rows = payload as T[];
  } else if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;

    if (obj.items !== undefined) {
      // CrudService::index → { items: transformList(...), pageResponse: paginator }
      const itemsValue = obj.items;
      if (Array.isArray(itemsValue)) {
        rows = itemsValue as T[];
      } else if (
        itemsValue &&
        typeof itemsValue === "object" &&
        Array.isArray((itemsValue as Record<string, unknown>).data)
      ) {
        rows = (itemsValue as Record<string, unknown>).data as T[];
      }
      const page = obj.pageResponse;
      meta = page && typeof page === "object" ? (page as Record<string, unknown>) : {};
    } else if (Array.isArray(obj.data)) {
      rows = obj.data as T[];
      meta = (obj.meta as Record<string, unknown>) ?? obj;
    } else if (
      obj.data &&
      typeof obj.data === "object" &&
      Array.isArray((obj.data as Record<string, unknown>).data)
    ) {
      const inner = obj.data as Record<string, unknown>;
      rows = inner.data as T[];
      meta = (inner.meta as Record<string, unknown>) ?? inner;
    }
  }

  const positive = (value: unknown, fallback: number): number => {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : fallback;
  };

  const total = Number(meta.total ?? rows.length) || rows.length;
  const perPage = positive(meta.per_page ?? meta.perPage, Math.max(rows.length, 1));
  const currentPage = positive(meta.current_page ?? meta.currentPage, 1);
  const lastPage = positive(
    meta.last_page ?? meta.lastPage,
    Math.max(1, Math.ceil(total / perPage)),
  );

  return {
    rows,
    meta: {
      total,
      perPage,
      currentPage,
      lastPage,
      from: Number(meta.from ?? (rows.length === 0 ? 0 : (currentPage - 1) * perPage + 1)) || 0,
      to: Number(meta.to ?? Math.min(currentPage * perPage, total)) || 0,
    },
  };
}

/* -------------------------------- resource -------------------------------- */

export async function listResource<T>(resource: string, params: QueryParams = {}): Promise<IndexResult<T>> {
  const raw = await api.get<unknown>(resource, params);
  return normalizeIndex<T>(raw);
}

/**
 * Cached RAW builder groups, e.g.
 *   users/builder → { roles: [{id,name}], statuses: [...] }
 *   roles/builder → { data: [...], grouped: [{group, permissions}] }
 * One request serves every filter and field on the page; each consumer picks
 * its group via `builderKey` and maps the shape with `toOptions`.
 */
const builderCache = new Map<string, Promise<Record<string, unknown[]>>>();

export function getBuilderRaw(
  resource: string,
  { force = false }: { force?: boolean } = {},
): Promise<Record<string, unknown[]>> {
  if (force) builderCache.delete(resource);

  const cached = builderCache.get(resource);
  if (cached) return cached;

  const request = api
    .get<Record<string, unknown>>(`${resource}/builder`)
    .then((raw) => {
      // Peel ResultService / resource envelopes until the groups are exposed.
      let payload: Record<string, unknown> = raw ?? {};
      for (const envelope of ["item", "data", "result"]) {
        const inner = payload[envelope];
        if (inner && typeof inner === "object" && !Array.isArray(inner)) {
          payload = inner as Record<string, unknown>;
        }
      }

      const out: Record<string, unknown[]> = {};
      for (const [key, value] of Object.entries(payload)) {
        out[key] = Array.isArray(value) ? value : [];
      }
      return out;
    })
    .catch((error: unknown) => {
      builderCache.delete(resource);
      throw error;
    });

  builderCache.set(resource, request);
  return request;
}

/** Call after a mutation that changes option lists. */
export function clearBuilderCache(resource?: string): void {
  if (resource) builderCache.delete(resource);
  else builderCache.clear();
}

export const showResource = <T>(resource: string, id: string | number): Promise<T> =>
  api.get<T>(`${resource}/${id}`).then((raw) => unwrapEnvelope<T>(raw));

export const createResource = <T>(resource: string, body: unknown): Promise<T> =>
  api.post<T>(resource, body).then((raw) => unwrapEnvelope<T>(raw));

export const updateResource = <T>(resource: string, id: string | number, body: unknown): Promise<T> =>
  api.put<T>(`${resource}/${id}`, body).then((raw) => unwrapEnvelope<T>(raw));

export const deleteResource = (resource: string, id: string | number): Promise<unknown> =>
  api.delete(`${resource}/${id}`);

/* --------------------------- extra CRUD actions --------------------------- */

/**
 * Flip `is_active` — CrudService::toggleActiveStatus.
 * Endpoint: PUT {resource}/{id}/toggle-active (change here if yours differs).
 */
export const toggleResourceActive = <T>(resource: string, id: string | number): Promise<T> =>
  api.put<T>(`${resource}/${id}/toggle-active`).then((raw) => unwrapEnvelope<T>(raw));

/**
 * Server-side export — CrudService::export.
 * A plain GET with the SAME filters as the table; the backend produces the
 * file. If it answers with a link instead, we open it.
 */
export const exportResource = async (
  resource: string,
  params: QueryParams = {},
): Promise<void> => {
  const response = await api.get<unknown>(`${resource}/export`, params);
  const payload = unwrapEnvelope(response) as Record<string, unknown> | string | null;

  const url =
    typeof payload === "string"
      ? payload
      : ((payload?.url ?? payload?.link ?? payload?.path) as string | undefined);

  if (url) window.open(url, "_blank", "noopener");
};

/**
 * Persist a display order — CrudService::reOrder.
 * Body: { data: [{ id, sort_order }] }.
 */
export const reorderResource = (
  resource: string,
  rows: Array<{ id: string | number; sort_order: number }>,
): Promise<unknown> => api.post(`${resource}/reorder`, { data: rows });

/* ------------------------------- singletons ------------------------------- */

/**
 * Singleton resources have no id — the whole record IS the endpoint
 * (settings, site config…):  GET {resource}  /  POST {resource}.
 */
export const fetchSingleton = <T>(resource: string): Promise<T> =>
  api.get<T>(resource).then((raw) => unwrapEnvelope<T>(raw));

export const saveSingleton = <T>(resource: string, body: unknown): Promise<T> =>
  api.post<T>(resource, body).then((raw) => unwrapEnvelope<T>(raw));
