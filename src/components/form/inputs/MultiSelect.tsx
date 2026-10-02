import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";
import type { SelectOption } from "@/components/form/types";

interface MultiSelectProps {
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  /** Show a search box once the list is long. */
  searchThreshold?: number;
}

/** Tag-based multi select — used for roles, categories, tags… */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  searchThreshold = 7,
}: MultiSelectProps) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false));

  const selected = useMemo(
    () => options.filter((option) => value.includes(option.value)),
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const toggle = (optionValue: string) => {
    onChange(
      value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue],
    );
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex w-full items-center gap-2 rounded-control border bg-slate-50/80 px-3 py-2 text-start transition-all",
          "focus:outline-none focus:ring-4 disabled:opacity-60",
          "dark:bg-slate-800/60",
          error
            ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
            : "border-slate-200 focus:border-brand-500/60 focus:ring-brand-500/10 dark:border-slate-700",
        )}
      >
        <span className="flex min-h-[1.5rem] min-w-0 flex-1 flex-wrap items-center gap-1.5">
          {selected.length === 0 && (
            <span className="text-sm text-slate-400">{placeholder ?? t("form.selectPlaceholder")}</span>
          )}
          {selected.map((option) => (
            <span
              key={option.value}
              className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300"
            >
              {option.label}
              <span
                role="button"
                tabIndex={-1}
                aria-label={`${t("form.remove")} ${option.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(option.value);
                }}
                className="grid size-3.5 place-items-center rounded-full transition-colors hover:bg-brand-500/25"
              >
                <X className="size-2.5" />
              </span>
            </span>
          ))}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-slate-400 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-0 top-full z-40 mt-2 origin-top overflow-hidden rounded-card border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            {options.length >= searchThreshold && (
              <div className="relative border-b border-slate-200/70 p-2 dark:border-slate-700/60">
                <Search className="pointer-events-none absolute start-4 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("form.search")}
                  className="w-full rounded-control bg-slate-100 py-1.5 pe-2 ps-8 text-sm outline-none dark:bg-slate-800 dark:text-white"
                />
              </div>
            )}

            <div className="max-h-56 overflow-y-auto p-1.5">
              {filtered.length === 0 ? (
                <p className="px-3 py-6 text-center text-xs text-slate-400">{t("form.noOptions")}</p>
              ) : (
                filtered.map((option) => {
                  const active = value.includes(option.value);
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => toggle(option.value)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-control px-2.5 py-2 text-start text-sm transition-colors",
                        active
                          ? "bg-brand-500/[0.08] font-semibold text-brand-700 dark:text-brand-300"
                          : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-4 shrink-0 place-items-center rounded border transition-colors",
                          active
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-300 dark:border-slate-600",
                        )}
                      >
                        {active && <Check className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
