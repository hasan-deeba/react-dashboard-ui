import { motion } from "framer-motion";
import { ArrowLeft, Compass, LifeBuoy } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

const digitTransition = (delay: number) => ({
  type: "spring" as const,
  stiffness: 320,
  damping: 16,
  delay,
});

/** 404 — rendered by the router's catch-all route. */
export function NotFound() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="surface-card relative w-full max-w-md px-8 py-12 text-center"
      >
        {/* Ambient glow (slowly breathing) */}
        <motion.div
          aria-hidden
          animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="absolute -top-20 start-1/2 size-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/15 to-accent-500/15 blur-2xl rtl:translate-x-1/2"
        />

        {/* 404 digits — the middle "0" is a spinning compass (kept LTR) */}
        <div dir="ltr" className="relative flex items-center justify-center gap-2.5 sm:gap-3">
          <motion.span
            initial={{ opacity: 0, y: 32, rotate: -8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={digitTransition(0.1)}
            className="bg-gradient-to-br from-brand-500 to-accent-500 bg-clip-text font-display text-7xl font-extrabold text-transparent sm:text-8xl"
          >
            4
          </motion.span>

          <motion.span
            initial={{ opacity: 0, scale: 0, rotate: -90 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={digitTransition(0.2)}
            className="grid size-16 place-items-center rounded-full border-2 border-dashed border-slate-300 bg-white/60 sm:size-20 dark:border-slate-700 dark:bg-slate-800/60"
          >
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="grid place-items-center"
            >
              <Compass className="size-7 text-brand-600 sm:size-8 dark:text-brand-400" />
            </motion.span>
          </motion.span>

          <motion.span
            initial={{ opacity: 0, y: 32, rotate: 8 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={digitTransition(0.3)}
            className="bg-gradient-to-br from-brand-500 to-accent-500 bg-clip-text font-display text-7xl font-extrabold text-transparent sm:text-8xl"
          >
            4
          </motion.span>
        </div>

        <h1 className="relative mt-6 font-display text-2xl font-bold text-slate-900 dark:text-white">
          {t("general.notFound.title")}
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t("general.notFound.body")}
        </p>

        <p className="relative mt-3">
          <code
            dir="ltr"
            className="rounded-lg bg-slate-100 px-2.5 py-1 font-mono text-xs text-rose-500 ring-1 ring-inset ring-slate-200 dark:bg-slate-800/70 dark:text-rose-400 dark:ring-slate-700"
          >
            {pathname}
          </code>
        </p>

        <div className="relative mt-7 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
            {t("general.notFound.back")}
          </button>
          <button
            type="button"
            onClick={() => navigate("/help")}
            className="flex items-center gap-2 rounded-control border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <LifeBuoy className="size-4" />
            {t("general.notFound.help")}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
