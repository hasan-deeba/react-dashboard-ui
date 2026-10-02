/**
 * Auth endpoints (Laravel).
 *
 *   POST {base}/login      → { token, user }
 *   POST {base}/register   → { token, user }
 *   POST {base}/logout
 *   GET  {base}/profile    → user
 *   PUT  {base}/profile    → user
 *   POST {base}/profile/password
 *   POST {base}/profile/avatar   (multipart)
 *
 * Adjust the paths here only — nothing else in the app knows about them.
 */

import api from "@/services/api";

export interface AuthUser {
  id: string | number;
  name: string;
  email: string;
  /** Normalised from `avatar` / `image`. */
  image?: string | null;
  is_active: boolean;
  /** Bypasses every permission check. */
  is_super_admin: boolean;
  /** Role names (Spatie) — objects are flattened to their name. */
  roles: string[];
  role_ids: Array<string | number>;
  /** Permission names, e.g. "users.view". */
  permissions: string[];
  theme_preference?: string | null;
}

export interface Credentials {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface AuthResponse {
  token?: string;
  access_token?: string;
  /** ResultService envelope: { valid, code, message, item: { token, user } } */
  item?: { token?: string; access_token?: string; user?: unknown };
  data?: { token?: string; user?: unknown };
  user?: unknown;
}

/** Flatten ["users.view"] or [{ id, name }] to plain names. */
function toNames(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) =>
      typeof item === "string"
        ? item
        : String(
            (item as Record<string, unknown>)?.name ??
              (item as Record<string, unknown>)?.slug ??
              "",
          ),
    )
    .filter(Boolean);
}

/**
 * Laravel may wrap the user in `data`; roles/permissions may be objects.
 * Mirrors the `/profile` payload: { roles, role_ids, permissions,
 * is_super_admin, avatar, theme_preference }.
 */
export function normalizeUser(raw: unknown): AuthUser {
  const source = (raw && typeof raw === "object" && "data" in raw
    ? (raw as { data: unknown }).data
    : raw) as Record<string, unknown>;

  const roleIdsRaw = source?.role_ids;

  return {
    id: (source?.id as string | number) ?? "",
    name: String(source?.name ?? ""),
    email: String(source?.email ?? ""),
    image: (source?.avatar as string | null) ?? (source?.image as string | null) ?? null,
    is_active: source?.is_active === undefined ? true : Boolean(source.is_active),
    is_super_admin: Boolean(source?.is_super_admin),
    roles: toNames(source?.roles),
    role_ids: Array.isArray(roleIdsRaw) ? (roleIdsRaw as Array<string | number>) : [],
    permissions: toNames(source?.permissions),
    theme_preference: (source?.theme_preference as string | null) ?? null,
  };
}

/** ResultService may wrap the payload in `item` — unwrap once. */
function unwrapAuth(response: AuthResponse): AuthResponse {
  return (response.item as AuthResponse | undefined) ?? response;
}

function extractToken(response: AuthResponse): string {
  const source = unwrapAuth(response);
  return String(source.token ?? source.access_token ?? source.data?.token ?? "");
}

function extractUser(response: AuthResponse): AuthUser {
  const source = unwrapAuth(response);
  return normalizeUser(source.user ?? source.data?.user ?? source.data ?? source);
}

export async function login(credentials: Credentials): Promise<{ token: string; user: AuthUser }> {
  const response = await api.post<AuthResponse>("login", credentials);
  return { token: extractToken(response), user: extractUser(response) };
}

export async function register(payload: RegisterPayload): Promise<{ token: string; user: AuthUser }> {
  const response = await api.post<AuthResponse>("register", payload);
  return { token: extractToken(response), user: extractUser(response) };
}

export const logout = (): Promise<unknown> => api.post("logout");

export const fetchProfile = (): Promise<AuthUser> =>
  api.get<unknown>("profile").then(normalizeUser);

export const updateProfile = (payload: Partial<AuthUser>): Promise<AuthUser> =>
  api.put<unknown>("profile", payload).then(normalizeUser);

export const changePassword = (payload: {
  current_password: string;
  password: string;
  password_confirmation: string;
}): Promise<unknown> => api.post("profile/password", payload);

export const uploadAvatar = (file: File): Promise<AuthUser> => {
  const formData = new FormData();
  formData.append("image", file);
  return api.upload<unknown>("profile/avatar", formData).then(normalizeUser);
};
