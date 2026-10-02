import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { getLocaleMeta } from "@/i18n/locales";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";
import { IconButton } from "@/components/ui/IconButton";

/**
 * Header globe button with a dropdown to switch the UI language.
 * The list is generated from the locales discovered in `src/locales/`.
 */
export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const containerRef = useClickOutside<HTMLDivElement>(close);
  const locales = getLocaleMeta();

  return (
    <div ref={containerRef} className="relative">
      <IconButton label={t("general.language.label")} onClick={() => setOpen((prev) => !prev)}>
        <Globe className="size-5" />
      </IconButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="absolute end-0 top-full z-50 mt-3 w-44 origin-top overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 p-1.5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/40"
          >
            {locales.map((option) => {
              const active = locale === option.code;
              return (
                <button
                  key={option.code}
                  type="button"
                  dir={option.dir}
                  onClick={() => {
                    setLocale(option.code);
                    close();
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start transition-colors",
                    active
                      ? "bg-brand-500/[0.08] dark:bg-brand-500/10"
                      : "hover:bg-slate-100 dark:hover:bg-slate-800/70",
                  )}
                >
                  <span className="flex-1">
                    <span
                      className={cn(
                        "block text-sm font-semibold",
                        active
                          ? "text-brand-600 dark:text-brand-400"
                          : "text-slate-700 dark:text-slate-200",
                      )}
                    >
                      {option.nativeName}
                    </span>
                    <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                      {option.englishName}
                    </span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-brand-600 dark:text-brand-400" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
