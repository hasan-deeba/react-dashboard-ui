/**
 * TRANSLATABLE_TEXT settings widget.
 *
 * PURPOSE : the English and Arabic inputs side by side. English is required
 *           (server rejects an empty `en`); the Arabic input is optional and
 *           always renders dir="rtl" regardless of the dashboard direction.
 *           Values above ~255 chars get a textarea instead of a single line.
 * EXPORTS : TranslatableSetting.
 * EDIT    : labels come from the builder (already translated); only the two
 *           language names come from the locale files.
 */

import { useLanguage } from "@/context/LanguageContext";
import type { SettingsFieldMeta } from "@/types/settings";
import { fieldDomId, TRANSLATED_LANGS, type LangCode, type TranslatedDraft } from "@/views/settings/settingsState";
import { describedBy, errorId, FieldError, FieldLabel, inputClass } from "@/components/inputs";
import { cn } from "@/utils/cn";

interface TranslatableSettingProps {
  field: SettingsFieldMeta;
  draft: TranslatedDraft;
  /** Server/client errors keyed per language (base error falls back to `en`). */
  errors: { base?: string; en?: string; ar?: string };
  disabled?: boolean;
  onChange: (lang: LangCode, value: string) => void;
}

export function TranslatableSetting({ field, draft, errors, disabled, onChange }: TranslatableSettingProps) {
  const { t } = useLanguage();
  // 100-char names stay one line; 2000-char messages get room to breathe.
  const multiline = (field.max_length ?? 0) > 255;

  return (
    <div className="space-y-1.5">
      <FieldLabel required>{field.label}</FieldLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {TRANSLATED_LANGS.map((lang) => {
          const id = fieldDomId(field.key, lang);
          const error = errors[lang] ?? (lang === "en" ? errors.base : undefined);
          const described = describedBy(error ? errorId(id) : undefined);
          return (
            <div key={lang} className="space-y-1.5">
              <FieldLabel htmlFor={id} required={lang === "en"}>
                {lang === "ar" ? t("settings.langs.ar") : t("settings.langs.en")}
              </FieldLabel>
              {multiline ? (
                <textarea
                  id={id}
                  rows={3}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  value={draft[lang]}
                  onChange={(event) => onChange(lang, event.target.value)}
                  maxLength={field.max_length}
                  disabled={disabled}
                  aria-invalid={Boolean(error)}
                  aria-describedby={described}
                  className={cn(inputClass(Boolean(error)), "resize-y")}
                />
              ) : (
                <input
                  id={id}
                  type="text"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  value={draft[lang]}
                  onChange={(event) => onChange(lang, event.target.value)}
                  maxLength={field.max_length}
                  disabled={disabled}
                  aria-invalid={Boolean(error)}
                  aria-describedby={described}
                  className={inputClass(Boolean(error))}
                />
              )}
              <FieldError id={errorId(id)} message={error} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
