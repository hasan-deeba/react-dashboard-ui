/**
 * HTTP transport.
 *
 * PURPOSE : the only module that talks to `fetch`. Adds auth + locale
 *           headers, serialises query params, and converts failures into
 *           `ApiError` so every caller can handle errors uniformly.
 * EXPORTS : default `api` ({ get, post, put, patch, delete, upload,
 *           setToken, clearToken, clearAuth }), ApiError, AUTH_UNAUTHORIZED_EVENT,
 *           request types.
 * EDIT    : resource-shaped calls belong in `services/resources.ts`, auth
 *           calls in `services/auth.ts` — add endpoints there, not here.
 *
 * Session expiry: when an AUTHENTICATED request hits a non-auth endpoint and
 * receives 401, the `AUTH_UNAUTHORIZED_EVENT` window event is dispatched
 * once. AuthContext listens, clears the session and toasts; the route guards
 * then redirect to /login. Parallel failures are deduped by the listener.
 */

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export const AUTH_UNAUTHORIZED_EVENT = "auth:unauthorized";

/** Endpoints where a 401 means "wrong credentials", not "expired session". */
const AUTH_ENDPOINTS = ["/login", "/register", "/logout", "/forgot-password", "/reset-password"];

export type QueryParams = Record<string, unknown>;
export type RequestHeaders = Record<string, string>;

export interface RequestOptions {
  params?: QueryParams;
  body?: unknown | FormData;
  headers?: RequestHeaders;
  signal?: AbortSignal;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function hasStoredToken(): boolean {
  return Boolean(localStorage.getItem("token") || sessionStorage.getItem("token"));
}

/** LanguageProvider paints `lang` on <html>, so this always matches the UI. */
function currentLocale(): string {
  return document.documentElement.lang || "en";
}

function buildUrl(endpoint: string, params: QueryParams = {}): string {
  const cleanEndpoint = endpoint.replace(/^\//, "");
  const url = new URL(
    /^https?:\/\//.test(cleanEndpoint) ? cleanEndpoint : `${BASE_URL}/${cleanEndpoint}`,
    BASE_URL || window.location.origin,
  );

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;

    // Repeated bracket keys so PHP parses them back as arrays.
    if (Array.isArray(value)) {
      if (value.length === 0) continue;
      for (const item of value) url.searchParams.append(`${key}[]`, String(item));
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  return url.toString();
}

async function handleResponse<T = unknown>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const data: unknown = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      (data as { message?: string })?.message ||
      (data as { error?: string })?.error ||
      `HTTP ${response.status}: ${response.statusText}`;
    throw new ApiError(message, response.status, data);
  }

  // A ResultService can report failure with HTTP 200 (valid:false, code:422|409…).
  if (data && typeof data === "object" && "valid" in (data as Record<string, unknown>)) {
    const envelope = data as { valid?: boolean; code?: number; message?: string };
    const code = Number(envelope.code ?? 0);
    if (envelope.valid === false && code >= 400) {
      throw new ApiError(envelope.message || `Request failed (${code})`, code, data);
    }
  }

  return data as T;
}

/**
 * Concurrent identical GETs share one request. React StrictMode double-mounts
 * effects in development, which would otherwise fire every read twice.
 */
const inflightGets = new Map<string, Promise<unknown>>();

async function request<T = unknown>(
  method: string,
  endpoint: string,
  options: RequestOptions = {},
): Promise<T> {
  const url = buildUrl(endpoint, options.params);

  if (method === "GET") {
    const existing = inflightGets.get(url);
    if (existing) return existing as Promise<T>;

    const promise = performRequest<T>(method, endpoint, url, options);
    inflightGets.set(url, promise);
    promise
      .catch(() => undefined) // never leave an unhandled rejection behind
      .finally(() => {
        if (inflightGets.get(url) === promise) inflightGets.delete(url);
      });
    return promise;
  }

  return performRequest<T>(method, endpoint, url, options);
}

async function performRequest<T = unknown>(
  method: string,
  endpoint: string,
  url: string,
  { body, headers = {}, signal }: RequestOptions,
): Promise<T> {
  const requestHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Accept-Language": currentLocale(),
    ...getAuthHeaders(),
    ...headers,
  };

  const options: RequestInit = { method, headers: requestHeaders, signal };

  if (body !== undefined && body !== null) {
    if (body instanceof FormData) {
      options.body = body;
      delete requestHeaders["Content-Type"]; // browser sets the multipart boundary
    } else {
      options.body = JSON.stringify(body);
    }
  }

  if (import.meta.env.DEV) {
    console.debug(`[api] ${method} ${url}`);
  }

  try {
    const response = await fetch(url, options);
    return await handleResponse<T>(response);
  } catch (error) {
    // Expired token on a real resource → announce once, let auth react.
    if (
      error instanceof ApiError &&
      error.status === 401 &&
      hasStoredToken() &&
      !AUTH_ENDPOINTS.some((auth) => endpoint.includes(auth)) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent(AUTH_UNAUTHORIZED_EVENT));
    }
    throw error;
  }
}

const api = {
  get<T = unknown>(endpoint: string, params?: QueryParams, headers?: RequestHeaders, signal?: AbortSignal): Promise<T> {
    return request<T>("GET", endpoint, { params, headers, signal });
  },

  post<T = unknown>(endpoint: string, body?: unknown, headers?: RequestHeaders): Promise<T> {
    return request<T>("POST", endpoint, { body, headers });
  },

  put<T = unknown>(endpoint: string, body?: unknown, headers?: RequestHeaders): Promise<T> {
    return request<T>("PUT", endpoint, { body, headers });
  },

  patch<T = unknown>(endpoint: string, body?: unknown, headers?: RequestHeaders): Promise<T> {
    return request<T>("PATCH", endpoint, { body, headers });
  },

  delete<T = unknown>(endpoint: string, params?: QueryParams, headers?: RequestHeaders): Promise<T> {
    return request<T>("DELETE", endpoint, { params, headers });
  },

  upload<T = unknown>(endpoint: string, formData: FormData, headers?: RequestHeaders): Promise<T> {
    return request<T>("POST", endpoint, { body: formData, headers });
  },

  setToken(token: string | null, remember = false): void {
    const storage = remember ? localStorage : sessionStorage;
    if (token) storage.setItem("token", token);
    else storage.removeItem("token");
  },

  clearToken(): void {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
  },

  clearAuth(): void {
    this.clearToken();
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
  },
};

export default api;
