/**
 * Dashboard widget: live activity feed.
 *
 * PURPOSE : latest rows of `GET activity-logs` rendered as a timeline.
 * EXPORTS : default ActivityFeed.
 * EDIT    : read-only widget — never block the dashboard. A failed request
 *           renders the empty state. Event tones come from the API
 *           (`event_type.color`), already using our semantic tone names.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ScrollText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { Skeleton } from "@/components/ui/Loading";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { buildIndexParams, listResource } from "@/services/resources";
import { TONE_CLASS, type Tone } from "@/lib/tones";
import { activityColor, activityEvent, type ActivityLog } from "@/types/models";
import { shortModel } from "@/views/activityLogs/Fields";
import { cn } from "@/utils/cn";

const ITEM_COUNT = 7;

export default function ActivityFeed() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const navigate = useNavigate();

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!can("activity_logs.view")) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    listResource<ActivityLog>(
      "activity-logs",
      buildIndexParams({
        page: 1,
        pageSize: ITEM_COUNT,
        sort: { key: "created_at", direction: "desc" },
      }),
    )
      .then((result) => {
        if (!cancelled) setLogs(result.rows);
      })
      .catch(() => {
        if (!cancelled) setLogs([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [can]);

  if (!can("activity_logs.view")) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-5 sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {t("activityLogs.title")}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t("activityLogs.description")}
          </p>
        </div>
        <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-500" />
          </span>
          {t("dashboard.activity.live")}
        </span>
      </div>

      <div className="flex-1 px-5 sm:px-6">
        {loading && (
          <div className="space-y-4 pb-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-9 shrink-0 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <span className="grid size-12 place-items-center rounded-icon bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
              <ScrollText className="size-5" />
            </span>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t("activityLogs.empty")}
            </p>
            <p className="max-w-xs text-xs text-slate-500 dark:text-slate-400">
              {t("activityLogs.emptyBody")}
            </p>
          </div>
        )}

        {!loading && logs.length > 0 && (
          <ul className="space-y-5">
            {logs.map((log, index) => {
              const causer = log.causer?.name ?? log.causer?.email ?? "";
              const event = activityEvent(log);
              const tone = (activityColor(log) || "default") as Tone;
              const isLast = index === logs.length - 1;

              return (
                <motion.li
                  key={String(log.id)}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.45 + index * 0.06, duration: 0.3 }}
                  className="relative flex gap-3"
                >
                  {!isLast && (
                    <span className="absolute start-[1.05rem] top-10 h-[calc(100%-0.75rem)] w-px bg-slate-200 dark:bg-slate-800" />
                  )}

                  {causer ? (
                    <InitialsAvatar
                      name={causer}
                      className="z-10 size-9 shrink-0 text-[11px] ring-4 ring-white dark:ring-slate-900"
                    />
                  ) : (
                    <span className="z-10 grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-400 ring-4 ring-white dark:bg-slate-800 dark:ring-slate-900">
                      <ScrollText className="size-4" />
                    </span>
                  )}

                  <div className="min-w-0 pt-0.5">
                    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm leading-snug text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-white">
                        {causer || t("activityLogs.system")}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset",
                          TONE_CLASS[tone],
                        )}
                      >
                        {event}
                      </span>
                      {log.subject_type && (
                        <span className="font-semibold text-brand-600 dark:text-brand-400">
                          {shortModel(log.subject_type)} #{log.subject_id ?? "—"}
                        </span>
                      )}
                    </p>
                    {log.created_at && (
                      <p className="mt-0.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
                        {log.created_at}
                      </p>
                    )}
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 border-t border-slate-200/70 p-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => navigate("/activity-logs")}
          className="flex w-full items-center justify-center gap-1.5 rounded-control py-2 text-sm font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
        >
          {t("dashboard.activity.viewAll")}
          <ArrowRight className="size-4 rtl:-scale-x-100" />
        </button>
      </div>
    </motion.section>
  );
}
