/**
 * Notification endpoints.
 *
 * PURPOSE : the header bell reads real notifications instead of mock data.
 * EXPORTS : AppNotification, NotificationType, listNotifications(),
 *           markNotificationRead(), markAllNotificationsRead(),
 *           deleteNotification().
 * EDIT    : `normalizeNotification` is deliberately generous — Laravel's
 *           notifications table nests the payload under `data`, while a
 *           custom table may expose flat columns. Map new shapes there, not
 *           in the components.
 *
 * Endpoints
 *   GET    notifications            list (newest first)
 *   POST   notifications/{id}/read  mark one read
 *   POST   notifications/read-all   mark every one read
 *   DELETE notifications/{id}       dismiss
 */

import api from "@/services/api";
import { listResource } from "@/services/resources";

export type NotificationType = "order" | "user" | "security" | "comment" | "system";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  /** Display-ready timestamp from the backend. */
  createdAt: string;
  read: boolean;
  /** Optional in-app destination. */
  link?: string;
}

const KNOWN_TYPES: NotificationType[] = ["order", "user", "security", "comment", "system"];

function pickType(raw: unknown): NotificationType {
  const value = String(raw ?? "").toLowerCase();
  return (KNOWN_TYPES.find((type) => value.includes(type)) ?? "system") as NotificationType;
}

/** Accepts flat rows or Laravel's `{ id, type, data: {...}, read_at }`. */
export function normalizeNotification(raw: unknown): AppNotification {
  const source = (raw ?? {}) as Record<string, unknown>;
  const data = (source.data ?? {}) as Record<string, unknown>;

  const title = String(source.title ?? data.title ?? data.subject ?? "");
  const description = String(
    source.description ?? source.message ?? data.message ?? data.body ?? "",
  );

  return {
    id: String(source.id ?? ""),
    type: pickType(source.type ?? data.type),
    title,
    description,
    createdAt: String(source.created_at ?? source.createdAt ?? ""),
    read: Boolean(source.read ?? source.is_read ?? source.read_at),
    link: (source.link as string) ?? (data.link as string) ?? undefined,
  };
}

export async function listNotifications(limit = 15): Promise<AppNotification[]> {
  const result = await listResource<unknown>("notifications", { per_page: limit });
  return result.rows.map(normalizeNotification);
}

export const markNotificationRead = (id: string): Promise<unknown> =>
  api.post(`notifications/${id}/read`);

export const markAllNotificationsRead = (): Promise<unknown> =>
  api.post("notifications/read-all");

export const deleteNotification = (id: string): Promise<unknown> =>
  api.delete(`notifications/${id}`);
