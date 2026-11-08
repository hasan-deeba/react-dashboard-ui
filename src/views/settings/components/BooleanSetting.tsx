/**
 * BOOLEAN settings widget.
 *
 * PURPOSE : a labelled switch row (same treatment as DynamicForm's switch)
 *           with the dashboard's shared keyboard-operable Switch. The helper
 *           text — which explains the real effect on client apps — is passed
 *           in fully translated by the dispatcher.
 * EXPORTS : BooleanSetting.
 * EDIT    : the confirm-before-enabling and lock-prerequisite flows are NOT
 *           here — the widget reports the toggle to the page
 *           (`useSettingsForm.requestToggle`), which owns dialogs.
 */

import type { SettingsFieldMeta } from "@/types/settings";
import { Switch } from "@/components/ui/FormField";
import { fieldDomId, type BooleanDraft } from "@/views/settings/settingsState";
import { errorId, FieldError } from "@/views/settings/components/chrome";
import { cn } from "@/utils/cn";

interface BooleanSettingProps {
  field: SettingsFieldMeta;
  draft: BooleanDraft;
  hint?: string;
  error?: string;
  disabled?: boolean;
  onToggle: (next: boolean) => void;
}

export function BooleanSetting({ field, draft, hint, error, disabled, onToggle }: BooleanSettingProps) {
  const id = fieldDomId(field.key);

  return (
    <div
      id={id}
      // Not a native input — the wrapper is focusable so "focus the first
      // invalid field" can still land on a switch.
      tabIndex={-1}
      className={cn(
        "flex items-center justify-between gap-3 rounded-control border p-3.5 outline-none transition-colors",
        "focus-visible:ring-4 focus-visible:ring-brand-500/20",
        error ? "border-rose-300 dark:border-rose-500/50" : "border-slate-200 dark:border-slate-700",
      )}
    >
      <div className="min-w-0 pe-3">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{field.label}</p>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>}
        <FieldError id={errorId(id)} message={error} />
      </div>
      <Switch
        checked={draft.value}
        onChange={onToggle}
        label={field.label}
        disabled={disabled}
      />
    </div>
  );
}
