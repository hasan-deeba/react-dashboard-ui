/**
 * BOOLEAN settings widget — thin adapter over the global SwitchField.
 *
 * PURPOSE : maps builder meta + the boolean draft onto the shared
 *           `SwitchField` input (`components/inputs`). The helper text —
 *           which explains the real effect on client apps — is passed in
 *           fully translated by the dispatcher.
 * EXPORTS : BooleanSetting.
 * EDIT    : the confirm-before-enabling and lock-prerequisite flows are NOT
 *           here — the widget reports the toggle to the page
 *           (`useSettingsForm.requestToggle`), which owns dialogs.
 */

import type { SettingsFieldMeta } from "@/types/settings";
import { SwitchField } from "@/components/inputs";
import { fieldDomId, type BooleanDraft } from "@/views/settings/settingsState";

interface BooleanSettingProps {
  field: SettingsFieldMeta;
  draft: BooleanDraft;
  hint?: string;
  error?: string;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}

export function BooleanSetting({ field, draft, hint, error, disabled, onToggle }: BooleanSettingProps) {
  return (
    <SwitchField
      id={fieldDomId(field.key)}
      label={field.label}
      hint={hint}
      error={error}
      checked={draft.value}
      disabled={disabled}
      onChange={onToggle}
    />
  );
}
