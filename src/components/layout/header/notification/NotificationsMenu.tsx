import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BellOff, CheckCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { AppNotification } from "@/services/notifications";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { IconButton } from "@/components/ui/IconButton";
import { Skeleton } from "@/components/ui/Loading";
import { NotificationItem } from "./NotificationItem";

interface NotificationsMenuProps {
  notifications: AppNotification[];
  unreadCount: number;
  loading?: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDismiss: (id: string) => void;
}

/** Bell button with live unread badge + the notifications popover. */
export function NotificationsMenu({
  notifications,
  unreadCount,
  loading = false,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
}: NotificationsMenuProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const containerRef = useClickOutside<HTMLDivElement>(close);

  return (
    <div ref={containerRef} className="relative">
      <IconButton
        label={`${t("notifications.title")}${unreadCount > 0 ? ` · ${unreadCount}` : ""}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Bell className="size-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key={unreadCount}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 22 }}
              className="absolute -end-1 -top-1 grid size-5 place-items-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-sm shadow-rose-500/40 ring-2 ring-white dark:ring-slate-900"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </IconButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="absolute end-0 top-full z-50 mt-3 w-[24rem] max-w-[calc(100vw-2.5rem)] origin-top overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/40"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-3 dark:border-slate-700/60">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-sm font-semibold text-slate-800 dark:text-white">
                  {t("notifications.title")}
                </h2>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                    {t("notifications.new", { count: unreadCount })}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={onMarkAllAsRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-40 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <CheckCheck className="size-3.5" />
                {t("notifications.markAll")}
              </button>
            </div>

            {/* List */}
            {loading ? (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <Skeleton className="size-9 shrink-0 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-2/3" />
                      <Skeleton className="h-2.5 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <ul className="max-h-[24rem] space-y-0.5 overflow-y-auto p-1.5">
                <AnimatePresence initial={false}>
                  {notifications.slice(0, 10).map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={onMarkAsRead}
                      onDismiss={onDismiss}
                      onOpen={(item) => {
                        if (item.link) {
                          navigate(item.link);
                          close();
                        }
                      }}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                  <BellOff className="size-6" />
                </span>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {t("notifications.empty")}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {t("notifications.emptyBody")}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-200/70 px-4 py-2.5 dark:border-slate-700/60">
              <p className="text-center text-[11px] text-slate-400 dark:text-slate-500">
                {t("notifications.footer")}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
