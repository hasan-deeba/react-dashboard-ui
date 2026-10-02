import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";

interface ComingSoonProps {
  /** i18n key of the page title, e.g. "general.nav.analytics-reports". */
  titleKey: string;
}

/** Placeholder used by every route that isn't part of the demo surface yet. */
export function ComingSoon({ titleKey }: ComingSoonProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const title = t(titleKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="flex min-h-[70vh] items-center justify-center"
    >
      <div className="surface-card relative w-full max-w-md px-8 py-12 text-center">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="absolute -top-20 start-1/2 size-64 -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-500/15 to-accent-500/15 blur-2xl rtl:translate-x-1/2"
        />

        <motion.span
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.1 }}
          className="relative mx-auto grid size-16 place-items-center rounded-icon bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-xl shadow-brand-600/30"
        >
          <Sparkles className="size-7" />
        </motion.span>

        <h1 className="relative mt-6 font-display text-2xl font-bold text-slate-900 dark:text-white">
          {title}
        </h1>
        <p className="relative mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {t("general.comingSoon.body", { title })}
        </p>

        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="relative mx-auto mt-7 flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03] active:scale-[0.98]"
        >
          <ArrowLeft className="size-4 rtl:-scale-x-100" />
          {t("general.comingSoon.back")}
        </button>
      </div>
    </motion.div>
  );
}
