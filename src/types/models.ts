/**
 * API model shapes.
 *
 * PURPOSE : describe what the Laravel API returns. Fields are intentionally
 *           loose where a value may arrive as a scalar OR a related object
 *           (Spatie roles are `["admin"]` in some payloads and
 *           `[{ id, name }]` in others).
 * EXPORTS : NamedRef, Ref, User, Permission, PermissionGroup, Role,
 *           refName(), refId().
 * EDIT    : never read `.name`/`.id` off a Ref directly — always go through
 *           refName()/refId() so both payload shapes keep working.
 */

export interface NamedRef {
  id: string | number;
  name: string;
}

/** A value that may arrive as a plain string or a related record. */
export type Ref = string | NamedRef;

export interface User {
  id: string | number;
  name: string;
  email: string;
  image?: string | null;
  is_active: boolean;
  roles?: Ref[];
  /** Flat fields some endpoints include. */
  role?: Ref;
  status?: string;
  team?: string;
  verified?: boolean;
  last_active?: string | number;
  created_at?: string;
}

export interface Permission {
  id: string | number;
  name: string;
  guard_name?: string;
  group?: string;
}

/** A `grouped` entry from `GET roles/builder`, rendered by GroupedCheckbox. */
export interface PermissionGroup {
  group: string;
  permissions: NamedRef[];
}

export interface Role {
  id: string | number;
  name: string;
  guard_name?: string;
  permissions?: Ref[];
  permissions_count?: number;
  users_count?: number;
  users?: User[];
  created_at?: string;
  updated_at?: string;
}

/* ------------------------------ activity log ------------------------------ */

export interface ActivityEventType {
  event: string;
  color?: string;
}

/** One row of the recorded diff. `value` is used by create/delete events. */
export interface ActivityChangeItem {
  field: string;
  old_value?: string | null;
  new_value?: string | null;
  value?: string | null;
}

export interface ActivityChanges {
  /** "diff" for updates; anything else renders as a flat attribute list. */
  type?: string;
  items?: ActivityChangeItem[];
  old?: Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export interface ActivityLog {
  id: string | number;
  /** May arrive as an object or a plain event string. */
  event_type?: ActivityEventType | string;
  description?: string;
  /** Who performed it — null for system/automated actions. */
  causer?: (NamedRef & { email?: string }) | null;
  causer_id?: string | number | null;
  /** What was affected. */
  subject_type?: string | null;
  subject_id?: string | number | null;
  changes?: ActivityChanges;
  properties?: ActivityChanges;
  created_at?: string;
}

/** Event name of a log entry, whatever shape the API used. */
export function activityEvent(log: ActivityLog): string {
  const type = log.event_type;
  if (!type) return "";
  return typeof type === "string" ? type : String(type.event ?? "");
}

/** Backend colour name for the event, if any. */
export function activityColor(log: ActivityLog): string {
  const type = log.event_type;
  return type && typeof type !== "string" ? String(type.color ?? "") : "";
}

/** Display name of a possibly-related value. */
export function refName(value: unknown): string {
  if (value && typeof value === "object") {
    return String((value as Record<string, unknown>).name ?? "");
  }
  return value == null ? "" : String(value);
}

/** Identifier of a possibly-related value (what forms and filters submit). */
export function refId(value: unknown): string {
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return String(obj.id ?? obj.value ?? obj.name ?? "");
  }
  return value == null ? "" : String(value);
}
