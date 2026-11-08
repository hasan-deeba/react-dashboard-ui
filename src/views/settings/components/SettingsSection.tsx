/**
 * One settings group rendered as a card with its own Save button.
 *
 * PURPOSE : a section per builder group (Branding, Support, Legal,
 *           Availability, Apps). Group and field labels come from the
 *           builder — already translated server-side. The "apps" group is
 *           special-cased into per-platform blocks (labels from the builder's
 *           `platforms` map) because iOS and Android are independent.
 *           Per-section save keeps each POST a small partial payload.
 * EXPORTS : SettingsSection.
 * EDIT    : layout only. Field-level behaviour lives in SettingsField and
 *           the page controller (`useSettingsForm`).
 */

import type { LucideIcon } from "lucide-react";
import { LifeBuoy, LockKeyhole, Palette, Power, Save, Settings as SettingsIcon, Smartphone, ScrollText } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Spinner } from "@/components/ui/Loading";
import type { SettingsFieldMeta, SettingsGroupMeta } from "@/types/settings";
import { SettingsField, type SettingsFieldContext } from "@/views/settings/components/SettingsField";
import { cn } from "@/utils/cn";

/** Decorative group icons — keyed by group.key with a generic fallback. */
const GROUP_ICONS: Record<string, LucideIcon> = {
  branding: Palette,
  support: LifeBuoy,
  legal: ScrollText,
  availability: Power,
  apps: Smartphone,
};

interface SettingsSectionProps {
  group: SettingsGroupMeta;
  platforms: Record<string, string>;
  ctx: SettingsFieldContext;
  canEdit: boolean;
  dirty: boolean;
  /** This section's request is in flight. */
  saving: boolean;
  /** Another section is saving — block concurrent saves. */
  savingOthers: boolean;
  onSave: () => void;
}

function FieldCell({ field, ctx }: { field: SettingsFieldMeta; ctx: SettingsFieldContext }) {
  const wide =
    field.type === "TRANSLATABLE_TEXT" || field.type === "IMAGE" || field.type === "BOOLEAN";
  return (
    <div className={cn("min-w-0", wide ? "sm:col-span-2" : "sm:col-span-1")}>
      <SettingsField field={field} ctx={ctx} />
    </div>
  );
}

export function SettingsSection({ group, platforms, ctx, canEdit, dirty, saving, savingOthers, onSave }: SettingsSectionProps) {
  const { t } = useLanguage();
  const Icon = GROUP_ICONS[group.key] ?? SettingsIcon;

  // "apps" fields are `apps.<platform>.<key>` → one block per platform. The
  // blocks are derived from the FIELD keys (labels from `platforms` when
  // known) so a future platform never silently drops out of the UI.
  const platformKeys =
    group.key === "apps"
      ? [...new Set(group.fields.map((field) => field.key.split(".")[1]).filter(Boolean))]
      : [];
  const platformFields = (platformKey: string): SettingsFieldMeta[] =>
    group.fields.filter((field) => field.key.split(".")[1] === platformKey);

  return (
    <section
      id={`settings-section-${group.key}`}
      aria-label={group.label}
      className="surface-card scroll-mt-24 overflow-hidden"
    >
      <header className="flex items-center gap-3 border-b border-slate-200/70 px-[var(--pad-card)] py-4 dark:border-slate-800">
        <span className="grid size-9 shrink-0 place-items-center rounded-icon bg-brand-500/10 text-brand-600 dark:text-brand-400">
          <Icon className="size-4.5" />
        </span>
        <h2 className="min-w-0 flex-1 font-display text-sm font-bold text-slate-900 dark:text-white">
          {group.label}
        </h2>
        {dirty && (
          <span className="shrink-0 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
            {t("settings.status.dirty")}
          </span>
        )}
      </header>

      <div className={cn("p-[var(--pad-card)]", platformKeys.length > 0 ? "space-y-6" : undefined)}>
        {platformKeys.length === 0 ? (
          <div className="grid gap-5 sm:grid-cols-2">
            {group.fields.map((field) => (
              <FieldCell key={field.key} field={field} ctx={ctx} />
            ))}
          </div>
        ) : (
          platformKeys.map((platformKey) => {
            const fields = platformFields(platformKey);
            if (fields.length === 0) return null;
            return (
              <div key={platformKey}>
                <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <Smartphone className="size-3.5" />
                  {platforms[platformKey] ?? platformKey}
                </h3>
                <div className="grid gap-5 sm:grid-cols-2">
                  {fields.map((field) => (
                    <FieldCell key={field.key} field={field} ctx={ctx} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-slate-200/70 px-[var(--pad-card)] py-4 dark:border-slate-800">
        {canEdit ? (
          <button
            type="button"
            disabled={!dirty || saving || savingOthers}
            onClick={onSave}
            className={cn(
              "flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2.5 text-xs font-bold text-white",
              "shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03] active:scale-[0.98]",
              "disabled:pointer-events-none disabled:opacity-60",
            )}
          >
            {saving ? <Spinner size="xs" onBrand /> : <Save className="size-3.5" />}
            {t(saving ? "settings.status.saving" : "settings.status.save")}
          </button>
        ) : (
          <p className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            <LockKeyhole className="size-3.5" />
            {t("settings.status.viewOnly")}
          </p>
        )}
      </footer>
    </section>
  );
}
