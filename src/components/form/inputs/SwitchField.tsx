/**
 * GLOBAL boolean input (`components/inputs`) — use anywhere.
 *
 * PURPOSE : the labelled switch row (title + helper text on the start side,
 *           toggle on the end side) built on the dashboard's shared Switch
 *           atom. Confirmation dialogs are NOT here — callers that gate a
 *           change behind a dialog receive the toggle and decide themselves.
 * EXPORTS : SwitchField.
 * EDIT    : visual treatment only — behavioural policy belongs to callers.
 */

import { useId } from "react";
import { Switch } from "@/components/form/inputs/Switch";
import { errorId, FieldError } from "@/components/form/inputs/FieldChrome";
import { cn } from "@/utils/cn";

export interface SwitchFieldProps {
  id?: string;
  label: string;
  hint?: string;
  error?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

export function SwitchField({ id, label, hint, error, checked, onChange, disabled }: SwitchFieldProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div
      id={fieldId}
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
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{label}</p>
        {hint && <p className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{hint}</p>}
        <FieldError id={errorId(fieldId)} message={error} />
      </div>
      <Switch checked={checked} onChange={onChange} label={label} disabled={disabled} />
    </div>
  );
}
