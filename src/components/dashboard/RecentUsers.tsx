/**
 * Dashboard widget: latest registered users.
 *
 * PURPOSE : live preview of `GET users` (newest first, 6 rows) with links
 *           into the users resource.
 * EXPORTS : default RecentUsers.
 * EDIT    : this is a read-only widget — it must never block the dashboard.
 *           A failed request renders the empty state instead of an error.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { Skeleton } from "@/components/ui/Loading";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { resourcePaths } from "@/lib/paths";
import { buildIndexParams, listResource } from "@/services/resources";
import { TONE_CLASS } from "@/lib/tones";
import { refName, type User } from "@/types/models";
import { cn } from "@/utils/cn";

const ROW_COUNT = 6;

export default function RecentUsers() {
  const { t } = useLanguage();
  const { can } = useAuth();
  const navigate = useNavigate();
  const m = useModelTranslation("users");
  const paths = resourcePaths("users");

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Without users.view the endpoint would 403 — skip the call entirely.
    if (!can("users.view")) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    listResource<User>(
      "users",
      buildIndexParams({
        page: 1,
        pageSize: ROW_COUNT,
        sort: { key: "created_at", direction: "desc" },
      }),
    )
      .then((result) => {
        if (!cancelled) setUsers(result.rows);
      })
      .catch(() => {
        if (!cancelled) setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [can]);

  if (!can("users.view")) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card overflow-hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-6">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {t("dashboard.recentUsers.title")}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t("dashboard.recentUsers.subtitle")}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate(paths.index)}
          className="flex items-center gap-1 rounded-control px-2 py-1.5 text-xs font-semibold text-brand-600 transition-colors hover:bg-brand-500/10 dark:text-brand-400"
        >
          {t("dashboard.recentUsers.viewAll")}
          <ArrowRight className="size-3.5 rtl:-scale-x-100" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-start text-sm">
          <thead>
            <tr className="border-y border-slate-200/70 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/30 dark:text-slate-500">
              <th className="px-5 py-3 text-start sm:px-6">{m.field("name")}</th>
              <th className="px-4 py-3 text-start">{m.field("roles")}</th>
              <th className="px-4 py-3 text-start">{m.field("isActive")}</th>
              <th className="px-5 py-3 text-start sm:px-6">{m.field("joined")}</th>
            </tr>
          </thead>
          <tbody>
            {loading &&
              Array.from({ length: 4 }).map((_, rowIndex) => (
                <tr key={rowIndex} className="border-b border-slate-100 dark:border-slate-800/60">
                  {Array.from({ length: 4 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-4">
                      <Skeleton className="h-3.5 w-full max-w-[8rem]" />
                    </td>
                  ))}
                </tr>
              ))}

            {!loading &&
              users.map((user, index) => {
                const roles = (user.roles ?? []).map(refName).filter(Boolean);
                return (
                  <motion.tr
                    key={String(user.id)}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + index * 0.05, duration: 0.3 }}
                    onClick={() => navigate(paths.show(user.id))}
                    className="cursor-pointer border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/70 dark:border-slate-800/60 dark:hover:bg-slate-800/40"
                  >
                    <td className="px-5 py-3.5 sm:px-6">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            className="size-9 shrink-0 rounded-full object-cover ring-2 ring-brand-500/25"
                          />
                        ) : (
                          <InitialsAvatar name={user.name} className="size-9 text-xs" />
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800 dark:text-slate-100">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      {roles.length === 0 ? (
                        <span className="text-slate-300">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {roles.map((role) => (
                            <span
                              key={role}
                              className={cn(
                                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ring-1 ring-inset",
                                TONE_CLASS.primary,
                              )}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset",
                          user.is_active ? TONE_CLASS.success : TONE_CLASS.default,
                        )}
                      >
                        <span className="size-1.5 rounded-full bg-current opacity-70" />
                        {user.is_active
                          ? m.key("values.active")
                          : m.key("values.inactive")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500 sm:px-6 dark:text-slate-400">
                      {user.created_at ?? "—"}
                    </td>
                  </motion.tr>
                );
              })}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <span className="grid size-12 place-items-center rounded-icon bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                      <UserPlus className="size-5" />
                    </span>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {m.emptyTitle}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}
