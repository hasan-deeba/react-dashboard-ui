/**
 * The frame around every form control (`components/form/inputs/FieldFrame`).
 *
 * WHAT IT DOES : renders the parts that surround an input — its LABEL
 *                above, its ERROR or HINT below — plus the input class
 *                string and the aria/id helpers that wire them together
 *                (label ↔ control via htmlFor, error/hint via
 *                aria-describedby). Every field in the app uses this frame
 *                so they all look and behave identically.
 * EXPORTS : FieldLabel, FieldError, FieldHint, inputClass(), errorId(),
 *           hintId(), describedBy().
 * EDIT    : visual changes belong here, not in the widgets. Messages arrive
 *           already translated (server or locale files) — render with
 *           dir="auto", never translate them again.
 */

import type { ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/utils/cn";

export const errorId = (inputId: string): string => `${inputId}-error`;
export const hintId = (inputId: string): string => `${inputId}-hint`;

/** Combine the aria-describedby targets, skipping absent ones. */
export function describedBy(...ids: Array<string | undefined>): string | undefined {
  const present = ids.filter((id): id is string => Boolean(id));
  return present.length > 0 ? present.join(" ") : undefined;
}

export function FieldLabel({
  htmlFor,
  required = false,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: ReactNode;
}) {
  const className = "block text-xs font-semibold text-slate-600 dark:text-slate-300";
  const body = (
    <>
      {children}
      {required && <span className="text-rose-500"> *</span>}
    </>
  );
  // Without a control id it is a group caption — a span, not a label.
  return htmlFor ? (
    <label htmlFor={htmlFor} className={className}>
      {body}
    </label>
  ) : (
    <span className={className}>{body}</span>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
      <AlertCircle className="size-3.5 shrink-0" />
      <span dir="auto">{message}</span>
    </p>
  );
}

export function FieldHint({ id, children }: { id: string; children?: ReactNode }) {
  if (!children) return null;
  return (
    <p id={id} className="text-xs text-slate-400 dark:text-slate-500">
      {children}
    </p>
  );
}

/** Same treatment as the dashboard's TextField input. */
export function inputClass(hasError: boolean, extra?: string): string {
  return cn(
    "w-full rounded-control border bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all",
    "placeholder:text-slate-400 focus:bg-white focus:ring-4",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-900",
    hasError
      ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/60"
      : "border-slate-200 focus:border-brand-500/60 focus:ring-brand-500/10 dark:border-slate-700",
    extra,
  );
}
