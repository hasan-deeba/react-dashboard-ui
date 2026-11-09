/**
 * TRANSLATABLE_MARKDOWN widget (legal documents).
 *
 * PURPOSE : one language tab pair (English / العربية), each with a Write ↔
 *           Preview switch. The editor is the global RichTextEditor
 *           (formatted text — no visible Markdown syntax); the preview is
 *           sanitized rendered HTML (utils/markdown.ts). Storage stays
 *           Markdown via components/inputs/richText.ts.
 *           Arabic editor and preview render RTL. Both languages are
 *           optional — English is NOT required here, unlike app_name.
 * EXPORTS : MarkdownSetting.
 * EDIT    : when a server error targets the hidden language tab
 *           (`legal.terms_text.ar`), the widget auto-switches to it and
 *           focuses its editor — do not remove that effect.
 */

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import type { SettingsFieldMeta } from "@/types/settings";
import { fieldDomId, TRANSLATED_LANGS, type LangCode, type TranslatedDraft } from "@/views/settings/settingsState";
import { renderMarkdownPreview } from "@/utils/markdown";
import {
  describedBy,
  errorId,
  FieldError,
  FieldHint,
  FieldLabel,
  hintId,
  RichTextEditor,
} from "@/components/inputs";
import { cn } from "@/utils/cn";

export const MARKDOWN_MAX_FALLBACK = 50000;

interface MarkdownSettingProps {
  field: SettingsFieldMeta;
  draft: TranslatedDraft;
  errors: { base?: string; en?: string; ar?: string };
  disabled?: boolean;
  onChange: (lang: LangCode, value: string) => void;
}

export function MarkdownSetting({ field, draft, errors, disabled, onChange }: MarkdownSettingProps) {
  const { t } = useLanguage();
  const [lang, setLang] = useState<LangCode>("en");
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  const max = field.max_length ?? MARKDOWN_MAX_FALLBACK;
  const value = draft[lang];
  const id = fieldDomId(field.key, lang);
  const error = errors[lang] ?? errors.base;
  const hint = t("settings.hints.legalText");
  const described = describedBy(error ? errorId(id) : undefined, hintId(id));

  /**
   * A 422/client error may target the language whose tab is hidden — switch
   * to it, force Write mode (the textarea owns the focus id) and focus it.
   */
  const failing: LangCode | null = errors.en ? "en" : errors.ar ? "ar" : null;
  useEffect(() => {
    if (!failing) return;
    if (failing !== lang) setLang(failing);
    setMode("edit");
    requestAnimationFrame(() =>
      document.getElementById(fieldDomId(field.key, failing))?.focus(),
    );
  }, [failing, field.key, lang]);

  const previewHtml = useMemo(() => renderMarkdownPreview(value), [value]);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel>{field.label}</FieldLabel>

        {/* Language tabs */}
        <div className="flex rounded-control border border-slate-200 p-0.5 dark:border-slate-700" role="group" aria-label={field.label}>
          {TRANSLATED_LANGS.map((code) => (
            <button
              key={code}
              type="button"
              aria-pressed={lang === code}
              onClick={() => setLang(code)}
              className={cn(
                "relative rounded-[calc(var(--r-control)-2px)] px-3 py-1 text-[11px] font-semibold transition-colors",
                lang === code
                  ? "bg-brand-600 text-white shadow"
                  : "text-slate-500 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400",
              )}
            >
              {t(`settings.langs.${code}`)}
              {/* Dot marks that this language already has content. */}
              {draft[code].trim() !== "" && lang !== code && (
                <span aria-hidden className="absolute -end-0.5 -top-0.5 size-1.5 rounded-full bg-brand-400" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Write / preview switch */}
      <div className="flex items-center gap-1" role="group" aria-label={t("settings.editor.preview")}>
        {(["edit", "preview"] as const).map((nextMode) => (
          <button
            key={nextMode}
            type="button"
            aria-pressed={mode === nextMode}
            onClick={() => setMode(nextMode)}
            className={cn(
              "rounded-control px-2.5 py-1 text-[11px] font-semibold transition-colors",
              mode === nextMode
                ? "bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white"
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
            )}
          >
            {t(nextMode === "edit" ? "settings.editor.edit" : "settings.editor.preview")}
          </button>
        ))}
      </div>

      {mode === "edit" ? (
        <RichTextEditor
          id={id}
          value={value}
          onChange={(next) => onChange(lang, next)}
          dir={lang === "ar" ? "rtl" : "ltr"}
          documentKey={`${field.key}.${lang}`}
          disabled={disabled}
          hasError={Boolean(error)}
          describedBy={described}
        />
      ) : (
        <div
          dir={lang === "ar" ? "rtl" : "ltr"}
          className="settings-md min-h-40 rounded-control border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200"
        >
          {value.trim() === "" ? (
            <p className="text-xs text-slate-400">{t("settings.editor.empty")}</p>
          ) : (
            // Sanitized by renderMarkdownPreview — never raw API HTML.
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          )}
        </div>
      )}

      {error ? (
        <FieldError id={errorId(id)} message={error} />
      ) : (
        <div className="flex items-start justify-between gap-3">
          <FieldHint id={hintId(id)}>{hint}</FieldHint>
          <span className="shrink-0 text-[11px] tabular-nums text-slate-400 dark:text-slate-500">
            {t("settings.editor.count", { count: value.length, max })}
          </span>
        </div>
      )}
    </div>
  );
}
