/**
 * One row in the notification menu.
 *
 * EDIT    : title/description are REAL strings from the API (already
 *           localised by the backend) — never run them through `t()`.
 */

import { motion } from "framer-motion";
import {
  Bell,
  MessageSquare,
  ServerCog,
  ShieldAlert,
  ShoppingBag,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import type { AppNotification, NotificationType } from "@/services/notifications";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

const TYPE_META: Record<NotificationType, { icon: LucideIcon; well: string }> = {
  order: { icon: ShoppingBag, well: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  user: { icon: UserPlus, well: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  security: { icon: ShieldAlert, well: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  comment: { icon: MessageSquare, well: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  system: { icon: ServerCog, well: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
};

interface NotificationItemProps {
  notification: AppNotification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onOpen?: (notification: AppNotification) => void;
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onDismiss,
  onOpen,
}: NotificationItemProps) {
  const { t } = useLanguage();
  const meta = TYPE_META[notification.type] ?? { icon: Bell, well: TYPE_META.system.well };
  const Icon = meta.icon;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -32, height: 0, marginBottom: 0, overflow: "hidden" }}
      transition={{ duration: 0.2 }}
      className="group relative"
    >
      <button
        type="button"
        onClick={() => {
          onMarkAsRead(notification.id);
          onOpen?.(notification);
        }}
        className={cn(
          "flex w-full items-start gap-3 rounded-xl px-3 py-3 pe-9 text-start transition-colors",
          "hover:bg-slate-100/80 dark:hover:bg-slate-800/60",
          !notification.read && "bg-brand-50/60 dark:bg-brand-500/[0.06]",
        )}
      >
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", meta.well)}>
          <Icon className="size-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              dir="auto"
              className={cn(
                "truncate text-sm",
                notification.read
                  ? "font-medium text-slate-600 dark:text-slate-300"
                  : "font-semibold text-slate-800 dark:text-white",
              )}
            >
              {notification.title}
            </span>
            {!notification.read && <span className="size-1.5 shrink-0 rounded-full bg-brand-500" />}
          </span>
          {notification.description && (
            <span
              dir="auto"
              className="mt-0.5 line-clamp-2 block text-xs leading-relaxed text-slate-500 dark:text-slate-400"
            >
              {notification.description}
            </span>
          )}
          {notification.createdAt && (
            <span className="mt-1 block text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {notification.createdAt}
            </span>
          )}
        </span>
      </button>

      <button
        type="button"
        aria-label={t("notifications.dismiss", { title: notification.title })}
        onClick={() => onDismiss(notification.id)}
        className={cn(
          "absolute end-2 top-2 grid size-6 place-items-center rounded-md text-slate-400",
          "transition-all hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200",
          "opacity-60 md:opacity-0 md:group-hover:opacity-100",
        )}
      >
        <X className="size-3.5" />
      </button>
    </motion.li>
  );
}
