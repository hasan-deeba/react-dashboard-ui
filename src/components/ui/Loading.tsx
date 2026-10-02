import { cn } from "@/utils/cn";

/**
 * Global loading primitives — the ONE place that defines how "busy" looks.
 * Change the spinner here and every screen updates.
 */

type SpinnerSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASS: Record<SpinnerSize, string> = {
  xs: "size-3.5 border-2",
  sm: "size-5 border-2",
  md: "size-8 border-[3px]",
  lg: "size-12 border-4",
};

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  /** Use on coloured backgrounds (e.g. inside a brand button). */
  onBrand?: boolean;
}

/** Bare spinning ring — compose it anywhere (buttons, inline states…). */
export function Spinner({ size = "md", className, onBrand = false }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      className={cn(
        "inline-block animate-spin rounded-full",
        SIZE_CLASS[size],
        onBrand
          ? "border-white/30 border-t-white"
          : "border-brand-500/20 border-t-brand-500",
        className,
      )}
    />
  );
}

/** Centred spinner for a card/panel region (tables, forms, show pages). */
export function LoadingPanel({
  className,
  minHeight = "min-h-[24rem]",
}: {
  className?: string;
  minHeight?: string;
}) {
  return (
    <div className={cn("surface-card grid place-items-center", minHeight, className)}>
      <Spinner />
    </div>
  );
}

/** Centred spinner filling the routed content area (lazy pages). */
export function LoadingSection({ className }: { className?: string }) {
  return (
    <div className={cn("flex min-h-[60vh] items-center justify-center", className)}>
      <Spinner />
    </div>
  );
}

/** Full-viewport loader — app boot, auth guards, route suspense. */
export function LoadingScreen({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid min-h-screen place-items-center bg-slate-100 dark:bg-slate-950",
        className,
      )}
    >
      <Spinner />
    </div>
  );
}

/** Shimmer block used to build skeleton rows/cards. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded bg-slate-200 dark:bg-slate-800", className)} />
  );
}
