/**
 * Scalar settings widget (TEXT / EMAIL / URL / PHONE / VERSION).
 *
 * PURPOSE : one labelled text input whose keyboard mode and direction match
 *           the declared type. Machine values (URLs, versions, phones…) stay
 *           LTR even in the RTL dashboard.
 * EXPORTS : TextSetting + ScalarWidgetProps (the shape every scalar widget
 *           shares).
 * EDIT    : rendering is type-driven from the builder meta — limits come
 *           from `max_length`; the minimum-version helper is passed in as
 *           `hint` by the dispatcher (SettingsField).
 */

import type { SettingsFieldMeta } from "@/types/settings";
import type { ScalarDraft } from "@/views/settings/settingsState";
import { fieldDomId } from "@/views/settings/settingsState";
import { describedBy, errorId, FieldError, FieldHint, FieldLabel, hintId, inputClass } from "@/components/form/inputs";

export interface ScalarWidgetProps {
  field: SettingsFieldMeta;
  draft: ScalarDraft;
  error?: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const INPUT_TYPE: Record<string, string> = {
  EMAIL: "email",
  URL: "url",
  PHONE: "tel",
};

/** Types whose content is machine-ish and always stays left-to-right. */
const LTR_TYPES = new Set(["EMAIL", "URL", "PHONE", "VERSION"]);

const PLACEHOLDERS: Record<string, string> = {
  URL: "https://example.com",
  VERSION: "1.10.0",
};

export function TextSetting({ field, draft, error, hint, disabled, onChange }: ScalarWidgetProps) {
  const id = fieldDomId(field.key);
  const described = describedBy(error ? errorId(id) : undefined, hint ? hintId(id) : undefined);

  return (
    <div className="space-y-1.5">
      <FieldLabel htmlFor={id} required={!field.nullable}>
        {field.label}
      </FieldLabel>
      <input
        id={id}
        type={INPUT_TYPE[field.type] ?? "text"}
        dir={LTR_TYPES.has(field.type) ? "ltr" : undefined}
        value={draft.value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={PLACEHOLDERS[field.type] ??
          (typeof field.default === "string" ? field.default : undefined)}
        maxLength={field.max_length}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={described}
        className={inputClass(Boolean(error))}
      />
      {error ? <FieldError id={errorId(id)} message={error} /> : <FieldHint id={hintId(id)}>{hint}</FieldHint>}
    </div>
  );
}
