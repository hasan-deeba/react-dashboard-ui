import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

/** Titled block used for every group of controls in the Theme Studio. */
export function StudioSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface-card p-[var(--pad-card)]", className)}>
      <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  preview?: ReactNode;
}

/** Accessible segmented control — used for radius, density, layout, etc. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-2 sm:grid-cols-4",
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-control border p-3 text-xs font-semibold transition-all",
              active
                ? "border-brand-500 bg-brand-500/10 text-brand-700 ring-2 ring-brand-500/25 dark:text-brand-300"
                : "border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800/60",
            )}
          >
            {option.preview}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
