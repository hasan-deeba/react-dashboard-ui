/**
 * Field dispatcher — renders a settings widget from the builder meta.
 *
 * PURPOSE : switch on `field.type` and wire the matching widget to the page
 *           handlers; unknown future types degrade to a read-only view
 *           instead of crashing. Per-key helper text (the maintenance /
 *           registration / lock explanations, the app-icon note, the
 *           minimum-version hint) is attached here from the locale files.
 * EXPORTS : SettingsField, SettingsFieldContext (the handler bundle the page
 *           passes down).
 * EDIT    : keep this GENERIC — keyed hints use suffix checks, never exact
 *           field-name branches that would break on future fields.
 */

import { useLanguage } from "@/context/LanguageContext";
import type { SettingsFieldMeta, SettingsValues } from "@/types/settings";
import {
  valueAtPath,
  type Drafts,
  type LangCode,
} from "@/views/settings/settingsState";
import { TextSetting } from "@/views/settings/components/TextSetting";
import { BooleanSetting } from "@/views/settings/components/BooleanSetting";
import { TranslatableSetting } from "@/views/settings/components/TranslatableSetting";
import { MarkdownSetting } from "@/views/settings/components/MarkdownSetting";
import { ImageSetting } from "@/views/settings/components/ImageSetting";
import { FieldHint, FieldLabel } from "@/views/settings/components/chrome";

/** Everything a widget needs, collected once by the page per section. */
export interface SettingsFieldContext {
  values: SettingsValues;
  drafts: Drafts;
  errors: Record<string, string>;
  /** View-only mode (no settings.edit) — every control disabled. */
  readOnly: boolean;
  /** The owning section's save is in flight. */
  saving: boolean;
  typeNames: Record<string, string>;
  onScalar: (key: string, value: string) => void;
  onTranslated: (key: string, lang: LangCode, value: string) => void;
  onToggle: (field: SettingsFieldMeta, next: boolean) => void;
  onStageImage: (field: SettingsFieldMeta, file: File) => void;
  onRemoveImage: (field: SettingsFieldMeta) => void;
  onUndoImage: (field: SettingsFieldMeta) => void;
  onImageError: (key: string, message: string | null) => void;
}

/** Key → locale key for the switch helper text (effects on client apps). */
const BOOLEAN_HINTS: Array<[suffix: string, key: string]> = [
  ["maintenance_enabled", "settings.hints.maintenance"],
  ["registration_enabled", "settings.hints.registration"],
  ["lock_for_update", "settings.hints.lock"],
];

function booleanHintKey(fieldKey: string): string | undefined {
  const leaf = fieldKey.split(".").pop() ?? fieldKey;
  return BOOLEAN_HINTS.find(([suffix]) => leaf === suffix)?.[1];
}

function ReadonlyFallback({ field, value, typeName }: { field: SettingsFieldMeta; value: unknown; typeName?: string }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-1.5">
      <FieldLabel>{field.label}</FieldLabel>
      <pre
        dir="ltr"
        className="overflow-x-auto rounded-control border border-slate-200 bg-slate-50/80 px-3.5 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
      >
        {value === undefined || value === null ? "—" : JSON.stringify(value, null, 2)}
      </pre>
      <FieldHint id={`setting-${field.key}-readonly`}>
        {t("settings.readonly", { type: typeName ?? field.type })}
      </FieldHint>
    </div>
  );
}

/** Types we have widgets for — anything else gets the read-only fallback. */
const KNOWN_TYPES = new Set([
  "TEXT",
  "TRANSLATABLE_TEXT",
  "TRANSLATABLE_MARKDOWN",
  "BOOLEAN",
  "IMAGE",
  "EMAIL",
  "URL",
  "PHONE",
  "VERSION",
]);

export function SettingsField({ field, ctx }: { field: SettingsFieldMeta; ctx: SettingsFieldContext }) {
  const { t } = useLanguage();
  const draft = ctx.drafts[field.key];

  if (!KNOWN_TYPES.has(field.type)) {
    return (
      <ReadonlyFallback
        field={field}
        value={valueAtPath(ctx.values, field.key)}
        typeName={ctx.typeNames[field.type]}
      />
    );
  }
  if (!draft) return null;

  const disabled = ctx.readOnly || ctx.saving;
  const error = ctx.errors[field.key];

  /* Minimum-version hint: "older than X must update · X and newer continue". */
  let scalarHint: string | undefined;
  if (field.type === "VERSION" && draft.kind === "scalar") {
    const version = draft.value.trim();
    scalarHint = version
      ? t("settings.hints.versionMin", { version })
      : t("settings.hints.versionFormat");
  }

  switch (draft.kind) {
    case "translated":
      return field.type === "TRANSLATABLE_MARKDOWN" ? (
        <MarkdownSetting
          field={field}
          draft={draft}
          errors={{
            base: error,
            en: ctx.errors[`${field.key}.en`],
            ar: ctx.errors[`${field.key}.ar`],
          }}
          disabled={disabled}
          onChange={(lang, value) => ctx.onTranslated(field.key, lang, value)}
        />
      ) : (
        <TranslatableSetting
          field={field}
          draft={draft}
          errors={{
            base: error,
            en: ctx.errors[`${field.key}.en`],
            ar: ctx.errors[`${field.key}.ar`],
          }}
          disabled={disabled}
          onChange={(lang, value) => ctx.onTranslated(field.key, lang, value)}
        />
      );

    case "boolean":
      return (
        <BooleanSetting
          field={field}
          draft={draft}
          hint={(() => {
            const key = booleanHintKey(field.key);
            return key ? t(key) : undefined;
          })()}
          error={error}
          disabled={disabled}
          onToggle={(next) => ctx.onToggle(field, next)}
        />
      );

    case "image":
      return (
        <ImageSetting
          field={field}
          draft={draft}
          currentUrl={(() => {
            const raw = valueAtPath(ctx.values, field.key);
            return typeof raw === "string" && raw ? raw : null;
          })()}
          extraHint={field.key === "branding.app_icon" ? t("settings.hints.appIcon") : undefined}
          error={error}
          disabled={disabled}
          uploading={ctx.saving && draft.stage.status === "staged"}
          onStage={(file) => ctx.onStageImage(field, file)}
          onRemove={() => ctx.onRemoveImage(field)}
          onUndo={() => ctx.onUndoImage(field)}
          onError={(message) => ctx.onImageError(field.key, message)}
        />
      );

    case "scalar":
      return (
        <TextSetting
          field={field}
          draft={draft}
          error={error}
          hint={scalarHint}
          disabled={disabled}
          onChange={(value) => ctx.onScalar(field.key, value)}
        />
      );
  }
}
