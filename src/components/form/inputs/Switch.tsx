/**
 * GLOBAL boolean switch atom (`components/form/inputs`) — the keyboard-
 * operable toggle used by SwitchField rows and inline settings alike.
 */

import { cn } from "@/utils/cn";

/** Accessible toggle switch. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          checked ? "start-[1.375rem]" : "start-0.5",
        )}
      />
    </button>
  );
}
