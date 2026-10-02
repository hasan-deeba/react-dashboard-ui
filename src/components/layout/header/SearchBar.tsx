import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CornerDownLeft, FileText, Search, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MENU_SECTIONS, menuLabelKey } from "@/data/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cn } from "@/utils/cn";

interface PageResult {
  id: string;
  path: string;
  label: string;
  icon: LucideIcon;
}

/** Command-palette style search over the pages the user can access. */
export function SearchBar() {
  const { t, locale } = useLanguage();
  const { can } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useClickOutside<HTMLDivElement>(() => setOpen(false));

  // Global ⌘K / Ctrl+K shortcut focuses the search.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /** Only pages the user is allowed to open, labelled in the active locale. */
  const pages = useMemo<PageResult[]>(
    () =>
      MENU_SECTIONS.flatMap((section) =>
        section.items
          .filter((item) => can(item.permission))
          .flatMap((item): PageResult[] => [
            { id: item.id, path: item.path, label: t(menuLabelKey(item)), icon: item.icon },
            ...(item.submenu
              ?.filter((sub) => can(sub.permission))
              .map((sub) => ({
                id: sub.id,
                path: sub.path,
                label: t(menuLabelKey(sub)),
                icon: FileText,
              })) ?? []),
          ]),
      ),
    [t, can],
  );

  const results = useMemo<PageResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages.slice(0, 5);
    return pages.filter((p) => p.label.toLowerCase().includes(q)).slice(0, 8);
  }, [query, pages]);

  // Re-run the localisation-dependent search when the language changes.
  useEffect(() => {
    setActiveIndex(0);
  }, [locale]);

  const pick = (result: PageResult) => {
    navigate(result.path);
    setQuery("");
    setOpen(false);
    setActiveIndex(0);
    inputRef.current?.blur();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[activeIndex]) {
      pick(results[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-sm md:block">
      <Search className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
      <input
        ref={inputRef}
        type="text"
        value={query}
        placeholder={t("header.search.placeholder")}
        onChange={(e) => {
          setQuery(e.target.value);
          setActiveIndex(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn(
          "w-full rounded-control border border-slate-200/80 bg-slate-100/70 py-2.5 pe-16 ps-10 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all",
          "focus:border-brand-500/50 focus:bg-white focus:ring-4 focus:ring-brand-500/10",
          "dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-white dark:placeholder-slate-500 dark:focus:bg-slate-900",
        )}
      />
      <kbd
        dir="ltr"
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
      >
        ⌘K
      </kbd>

      <AnimatePresence>
        {open && (query.trim().length > 0 || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute inset-x-0 top-full z-50 mt-2 origin-top overflow-hidden rounded-card border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/40"
          >
            <div className="max-h-80 overflow-y-auto p-1.5">
              {results.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-slate-400 dark:text-slate-500">
                  {t("header.search.noResults", { query })}
                </p>
              ) : (
                results.map((result, index) => {
                  const Icon = result.icon;
                  return (
                    <button
                      key={result.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => pick(result)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-start transition-colors",
                        index === activeIndex
                          ? "bg-brand-500/[0.08] dark:bg-brand-500/10"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800/60",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-lg transition-colors",
                          index === activeIndex
                            ? "bg-brand-500/15 text-brand-600 dark:text-brand-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                          {result.label}
                        </span>
                        <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                          {t("header.search.page")}
                        </span>
                      </span>
                      {index === activeIndex && (
                        <CornerDownLeft className="size-3.5 shrink-0 text-slate-300 rtl:-scale-x-100 dark:text-slate-600" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
            <div className="flex items-center gap-4 border-t border-slate-200/70 px-4 py-2 text-[10px] font-medium text-slate-400 dark:border-slate-700/60 dark:text-slate-500">
              <span className="flex items-center gap-1">
                <kbd dir="ltr" className="rounded border border-slate-200 px-1 dark:border-slate-700">↑↓</kbd>
                {t("header.search.navigate")}
              </span>
              <span className="flex items-center gap-1">
                <kbd dir="ltr" className="rounded border border-slate-200 px-1 dark:border-slate-700">↵</kbd>
                {t("header.search.open")}
              </span>
              <span className="flex items-center gap-1">
                <kbd dir="ltr" className="rounded border border-slate-200 px-1 dark:border-slate-700">esc</kbd>
                {t("header.search.close")}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
