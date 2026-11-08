/**
 * COLOR settings widget.
 *
 * PURPOSE : a native color picker (always emits #RRGGBB, which is exactly
 *           what the API accepts) paired with a hex text input for pasting
 *           values. Empty text clears the setting (the field is nullable).
 * EXPORTS : ColorSetting.
 * EDIT    : the regex here is the gate for the picker fallback only — the
 *           authoritative check lives in `views/settings/validation.ts`.
 */

import { useLanguage } from "@/context/LanguageContext";
import { fieldDomId } from "@/views/settings/settingsState";
import { cn } from "@/utils/cn";
import { describedBy, errorId, FieldError, FieldHint, FieldLabel, hintId, inputClass } from "@/views/settings/components/chrome";
import type { ScalarWidgetProps } from "@/views/settings/components/TextSetting";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const FALLBACK_SWATCH = "#000000";

export function ColorSetting({ field, draft, error, disabled, onChange }: ScalarWidgetProps) {
  const { t } = useLanguage();
  const id = fieldDomId(field.key);
  const pickerValue = HEX_RE.test(draft.value) ? draft.value : FALLBACK_SWATCH;
  const hint = field.nullable ? t("settings.hints.colorEmpty") : undefined;
  const described = describedBy(error ? errorId(id) : undefined, hint ? hintId(id) : undefined);

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} required={!field.nullable}>
        {field.label}
      </FieldLabel>
      <div className="flex items-center gap-2.5">
        <input
          type="color"
          aria-label={field.label}
          value={pickerValue}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "h-10 w-14 shrink-0 cursor-pointer rounded-control border border-slate-200 bg-transparent p-1",
            "disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700",
          )}
        />
        <input
          id={id}
          type="text"
          dir="ltr"
          value={draft.value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={typeof field.default === "string" ? field.default : "#2563EB"}
          maxLength={7}
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          className={inputClass(Boolean(error))}
        />
      </div>
      {error ? <FieldError id={errorId(id)} message={error} /> : <FieldHint id={hintId(id)}>{hint}</FieldHint>}
    </div>
  );
}
