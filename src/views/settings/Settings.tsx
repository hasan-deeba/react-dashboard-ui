/**
 * Application Settings page (/settings).
 *
 * PURPOSE : edits the CMS singleton settings against the Laravel backend —
 *           values from `GET settings`, form blueprint from
 *           `GET settings/builder`, saved as partial `POST settings`
 *           payloads. The page is permission-gated twice: the route requires
 *           `settings.view` (RequirePermission), and every Save is hidden
 *           without `settings.edit`. Leaving with unsaved changes asks first
 *           (in-app blocker + beforeunload).
 * EXPORTS : default Settings (registered in src/routes/routes.tsx).
 * EDIT    : keep the page composition-only — request/state rules belong in
 *           `useSettingsForm`, wire-shape rules in `settingsState.ts`, and
 *           validation in `validation.ts`.
 */

import { useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, Globe, RefreshCw } from "lucide-react";
import { useBlocker } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { resourcePermissions } from "@/lib/permissions";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Skeleton } from "@/components/ui/Loading";
import { Forbidden } from "@/components/pages/Forbidden";
import type { SettingsGroupMeta, SettingsValues } from "@/types/settings";
import { useSettingsForm, type SettingsFormController } from "@/views/settings/useSettingsForm";
import type { SettingsFieldContext } from "@/views/settings/components/SettingsField";
import { SettingsSection } from "@/views/settings/components/SettingsSection";
import { cn } from "@/utils/cn";

/** Skeleton mirror of a section card (header + two-thirds field grid). */
function SettingsSkeleton() {
  return (
    <div className="space-y-5">
      {["branding", "support", "apps"].map((key) => (
        <div key={key} className="surface-card overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-200/70 px-[var(--pad-card)] py-4 dark:border-slate-800">
            <Skeleton className="size-9 rounded-icon" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="grid gap-5 p-[var(--pad-card)] sm:grid-cols-2">
            <Skeleton className="h-10 sm:col-span-2" />
            <Skeleton className="h-10" />
            <Skeleton className="h-10" />
          </div>
          <div className="border-t border-slate-200/70 px-[var(--pad-card)] py-4 dark:border-slate-800">
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Retryable load failure (403 uses <Forbidden> instead — do not retry). */
function LoadErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useLanguage();
  return (
    <div className="surface-card grid min-h-[24rem] place-items-center">
      <div className="max-w-sm px-6 py-10 text-center">
        <span className="mx-auto grid size-12 place-items-center rounded-icon bg-rose-500/10 text-rose-500">
          <AlertCircle className="size-6" />
        </span>
        <h2 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
          {t("settings.status.loadError")}
        </h2>
        <p dir="auto" className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {message}
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mx-auto mt-6 flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          <RefreshCw className="size-3.5" />
          {t("settings.status.retry")}
        </button>
      </div>
    </div>
  );
}

function buildFieldContext(
  controller: SettingsFormController,
  values: SettingsValues,
  canEdit: boolean,
  typeNames: Record<string, string>,
): SettingsFieldContext {
  return {
    values,
    drafts: controller.drafts,
    errors: controller.errors,
    readOnly: !canEdit,
    saving: false, // replaced per section below
    typeNames,
    onScalar: controller.setScalar,
    onTranslated: controller.setTranslated,
    onToggle: controller.requestToggle,
    onStageImage: controller.stageImage,
    onRemoveImage: controller.removeImage,
    onUndoImage: controller.undoImage,
    onImageError: controller.setImageError,
  };
}

export default function Settings() {
  const m = useModelTranslation("settings");
  const { t } = useLanguage();
  const { can } = useAuth();
  const controller = useSettingsForm();
  const { builder, values, loading, loadError, retry } = controller;

  const canEdit = can(resourcePermissions("settings").edit);

  /* Warn before leaving with unsaved changes — router and browser alike. */
  const blocker = useBlocker(controller.dirty);
  useEffect(() => {
    if (!controller.dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [controller.dirty]);

  const dirtyGroups = useMemo(() => {
    if (!builder || !values) return new Set<string>();
    return new Set(
      builder.groups.filter((group) => controller.groupDirty(group)).map((group) => group.key),
    );
  }, [builder, values, controller]);

  if (loading) return <SettingsSkeleton />;
  if (loadError) {
    if (loadError.status === 403) return <Forbidden />;
    return <LoadErrorPanel message={loadError.message} onRetry={retry} />;
  }
  if (!builder || !values) return <SettingsSkeleton />;

  const pendingToggle = controller.pendingToggle;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-5"
    >
      {/* Page head — these are GLOBAL settings, not per-user preferences. */}
      <div className="surface-card px-[var(--pad-card)] py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                {m.plural}
              </h1>
              <span className="rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                {t("settings.scope.title")}
              </span>
            </div>
            <p className="mt-1 flex max-w-2xl items-start gap-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              <Globe className="mt-0.5 size-3.5 shrink-0 text-brand-500" />
              {t("settings.scope.body")}
            </p>
          </div>

          {/* Section jump-nav with dirty dots */}
          <nav aria-label={m.plural} className="flex flex-wrap items-center gap-1.5">
            {builder.groups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() =>
                  document
                    .getElementById(`settings-section-${group.key}`)
                    ?.scrollIntoView({ behavior: "smooth", block: "start" })
                }
                className={cn(
                  "relative rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 transition-colors",
                  "hover:border-brand-400/60 hover:text-brand-600 dark:border-slate-700 dark:text-slate-300 dark:hover:text-brand-400",
                )}
              >
                {group.label}
                {dirtyGroups.has(group.key) && (
                  <span
                    aria-hidden
                    className="absolute -end-0.5 -top-0.5 size-2 rounded-full bg-amber-500"
                  />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {builder.groups.map((group: SettingsGroupMeta) => (
        <SettingsSection
          key={group.key}
          group={group}
          platforms={builder.platforms}
          canEdit={canEdit}
          dirty={dirtyGroups.has(group.key)}
          saving={controller.savingGroup === group.key}
          savingOthers={controller.savingGroup !== null && controller.savingGroup !== group.key}
          onSave={() => void controller.saveGroup(group)}
          ctx={{
            ...buildFieldContext(controller, values, canEdit, builder.types),
            saving: controller.savingGroup === group.key,
          }}
        />
      ))}

      {/* Confirmations for switches that immediately affect live users. */}
      <ConfirmModal
        open={pendingToggle?.kind === "maintenance"}
        title={t("settings.dialogs.maintenance.title")}
        description={t("settings.dialogs.maintenance.body")}
        confirmLabel={t("settings.dialogs.maintenance.confirm")}
        tone="danger"
        onConfirm={controller.confirmPendingToggle}
        onCancel={controller.cancelPendingToggle}
      />
      <ConfirmModal
        open={pendingToggle?.kind === "lock"}
        title={t("settings.dialogs.lock.title")}
        description={t("settings.dialogs.lock.body")}
        confirmLabel={t("settings.dialogs.lock.confirm")}
        tone="danger"
        onConfirm={controller.confirmPendingToggle}
        onCancel={controller.cancelPendingToggle}
      />

      {/* Leaving with unsaved changes (in-app navigation). */}
      <ConfirmModal
        open={blocker.state === "blocked"}
        title={t("settings.dialogs.unsaved.title")}
        description={t("settings.dialogs.unsaved.body")}
        confirmLabel={t("settings.dialogs.unsaved.confirm")}
        cancelLabel={t("settings.dialogs.unsaved.stay")}
        tone="danger"
        onConfirm={() => blocker.proceed?.()}
        onCancel={() => blocker.reset?.()}
      />
    </motion.div>
  );
}
