/**
 * User detail page (/users/:id).
 *
 * EDIT    : Back/Edit URLs and the edit permission come from the resource
 *           conventions — only pass overrides when a route is non-standard.
 */

import { useMemo } from "react";
import { History } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DynamicShow } from "@/components/show/DynamicShow";
import { useLanguage } from "@/context/LanguageContext";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { resourcePaths } from "@/lib/paths";
import type { AuthUser } from "@/services/auth";
import { buildUserShowSections } from "@/views/users/Fields";

type UserRecord = AuthUser & Record<string, unknown>;

export default function UserShow() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const paths = resourcePaths("users");
  const m = useModelTranslation("users");

  const sections = useMemo(() => buildUserShowSections(m), [m]);

  return (
    <DynamicShow<UserRecord>
      resource="users"
      recordId={id}
      sections={sections}
      header={(record) => ({
        title: record.name,
        subtitle: record.email,
        image: record.image ?? null,
      })}
      aside={(record) => (
        <section className="surface-card p-[var(--pad-card)]">
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {t("activityLogs.userTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
            {t("activityLogs.description")}
          </p>
          <button
            type="button"
            onClick={() => navigate(paths.logs(record.id as string | number))}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-control border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <History className="size-3.5" />
            {t("activityLogs.viewLogs")}
          </button>
        </section>
      )}
    />
  );
}
