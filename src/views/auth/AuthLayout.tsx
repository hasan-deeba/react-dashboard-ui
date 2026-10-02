import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { DashboardConfig } from "@/config/DashboardConfig";
import { useLanguage } from "@/context/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/header/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/header/ThemeToggle";

/**
 * Centred, single-column shell for the auth screens.
 * Themed by the same tokens as the dashboard, RTL-aware.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const { t } = useLanguage();
  const Logo = DashboardConfig.logo;

  return (
    <div className="theme-fade relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-100 px-5 py-12 dark:bg-slate-950">
      {/* Ambient background — tinted by the active brand colour */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 end-[-6rem] size-[26rem] rounded-full bg-brand-400/25 blur-3xl dark:bg-brand-600/10" />
        <div className="absolute bottom-[-8rem] start-[-4rem] size-[22rem] rounded-full bg-accent-400/25 blur-3xl dark:bg-accent-600/10" />
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_10%,transparent_70%)]" />
      </div>

      {/* Locale + theme controls */}
      <div className="absolute end-4 top-4 flex items-center gap-1.5">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Brand mark */}
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-icon bg-gradient-to-br from-brand-500 to-accent-500 shadow-xl shadow-brand-600/30">
            <Logo className="size-7 text-white" />
          </span>
          <p className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white">
            {t("general.app.name")}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
            {t("general.app.tagline")}
          </p>
        </div>

        {/* Form card */}
        <div className="surface-card p-7 sm:p-8">
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>

          <div className="mt-7">{children}</div>
        </div>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</div>

        <p className="mt-6 text-center text-[11px] text-slate-400 dark:text-slate-600">
          © {new Date().getFullYear()} {t("general.app.name")}
        </p>
      </motion.div>
    </div>
  );
}
