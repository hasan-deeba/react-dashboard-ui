import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";

export interface SelectOption {
  value: string;
  label: string;
}

interface InlineSelectProps {
  options: SelectOption[];
  /** Current value — "" means "no selection" (shows `allLabel`). */
  value: string;
  onChange: (value: string) => void;
  /** Label used when nothing is selected; also adds the "reset" entry. */
  allLabel?: string;
  /** Highlight the trigger with brand colours when a value is active. */
  active?: boolean;
  icon?: LucideIcon;
  compact?: boolean;
  className?: string;
}

/** Compact custom dropdown used for table filters, page size, etc. */
export function InlineSelect({
  options,
  value,
  onChange,
  allLabel,
  active,
  icon: Icon,
  compact = false,
  className,
}: InlineSelectProps) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const ref = useClickOutside<HTMLDivElement>(close);

  const current = options.find((option) => option.value === value);
  const displayLabel = current?.label ?? allLabel ?? value;

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex items-center gap-2 rounded-control border text-xs font-semibold transition-all",
          compact ? "px-2.5 py-1.5" : "px-3 py-2 text-sm font-medium",
          active
            ? "border-brand-500/50 bg-brand-500/[0.08] text-brand-700 dark:text-brand-300"
            : "border-slate-200 bg-slate-50/80 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:bg-slate-800",
        )}
      >
        {Icon && <Icon className="size-3.5 shrink-0 opacity-70" />}
        <span className="max-w-40 truncate">{displayLabel}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 opacity-60 transition-transform", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            role="listbox"
            className="absolute end-0 top-full z-40 mt-2 max-h-64 min-w-full w-48 origin-top overflow-y-auto rounded-card border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            {allLabel !== undefined && (
              <OptionRow
                label={allLabel}
                selected={value === ""}
                onSelect={() => {
                  onChange("");
                  close();
                }}
              />
            )}
            {options.map((option) => (
              <OptionRow
                key={option.value}
                label={option.label}
                selected={option.value === value}
                onSelect={() => {
                  onChange(option.value);
                  close();
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OptionRow({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-start text-sm transition-colors",
        selected
          ? "bg-brand-500/[0.08] font-semibold text-brand-700 dark:text-brand-300"
          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected && <Check className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />}
    </button>
  );
}
