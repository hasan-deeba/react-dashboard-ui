/**
 * Semantic tone system.
 *
 * PURPOSE : single source of truth for every coloured badge, chip and action
 *           in the dashboard. Tones describe INTENT, not pigment, so a brand
 *           change never makes a name lie.
 * EXPORTS : Tone (+ BadgeTone/ActionTone aliases), TONE_CLASS,
 *           ACTION_TONE_CLASS, BULK_ACTION_TONE_CLASS.
 * EDIT    : add a tone by extending `Tone` — TypeScript then forces every map
 *           below to define it. `primary` and `secondary` must stay mapped to
 *           the brand and accent token ramps so they follow the Theme Studio.
 */

export type Tone =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "info";

export type BadgeTone = Tone;
export type ActionTone = Tone;

/** Soft pill styles for status badges and chips. */
export const TONE_CLASS: Record<Tone, string> = {
  default: "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-300",
  primary: "bg-brand-500/10 text-brand-600 ring-brand-500/20 dark:text-brand-400",
  secondary: "bg-accent-500/10 text-accent-600 ring-accent-500/20 dark:text-accent-400",
  success: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  warning: "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  danger: "bg-rose-500/10 text-rose-600 ring-rose-500/20 dark:text-rose-400",
  info: "bg-blue-500/10 text-blue-600 ring-blue-500/20 dark:text-blue-400",
};

/** Icon-button actions (table row actions): muted base, tone-coloured hover. */
export const ACTION_TONE_CLASS: Record<Tone, string> = {
  default: "text-slate-400 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400",
  primary: "text-slate-400 hover:bg-brand-500/10 hover:text-brand-600 dark:hover:text-brand-400",
  secondary:
    "text-slate-400 hover:bg-accent-500/10 hover:text-accent-600 dark:hover:text-accent-400",
  success:
    "text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400",
  warning: "text-slate-400 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400",
  danger: "text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 dark:hover:text-rose-400",
  info: "text-slate-400 hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400",
};

/** Text-button actions (bulk actions bar): tone-coloured label + hover wash. */
export const BULK_ACTION_TONE_CLASS: Record<Tone, string> = {
  default: "text-slate-600 hover:bg-white/60 dark:text-slate-200 dark:hover:bg-slate-800/60",
  primary: "text-brand-600 hover:bg-brand-500/15 dark:text-brand-400",
  secondary: "text-accent-600 hover:bg-accent-500/15 dark:text-accent-400",
  success: "text-emerald-600 hover:bg-emerald-500/15 dark:text-emerald-400",
  warning: "text-amber-600 hover:bg-amber-500/15 dark:text-amber-400",
  danger: "text-rose-600 hover:bg-rose-500/15 dark:text-rose-400",
  info: "text-blue-600 hover:bg-blue-500/15 dark:text-blue-400",
};
