/**
 * Header notification state.
 *
 * PURPOSE : loads real notifications, exposes the unread count and the
 *           mutations the bell menu needs.
 * EXPORTS : useNotifications() → { notifications, unreadCount, loading,
 *           markAsRead, markAllAsRead, dismiss, reload }.
 * EDIT    : every mutation is OPTIMISTIC — the UI updates first and the
 *           request follows, because a failed "mark as read" must never
 *           block the menu. Endpoints live in `services/notifications`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/services/notifications";

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((key) => key + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listNotifications()
      .then((rows) => {
        if (!cancelled) setNotifications(rows);
      })
      .catch(() => {
        // Never break the header — an unreachable endpoint just shows none.
        if (!cancelled) setNotifications([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !item.read).length,
    [notifications],
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
    void markNotificationRead(id).catch(() => undefined);
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    void markAllNotificationsRead().catch(() => undefined);
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    void deleteNotification(id).catch(() => undefined);
  }, []);

  return { notifications, unreadCount, loading, markAsRead, markAllAsRead, dismiss, reload };
}
