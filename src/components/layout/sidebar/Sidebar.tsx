import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Rocket, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { DashboardConfig } from "@/config/DashboardConfig";
import { MENU_SECTIONS } from "@/data/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBrandTheme } from "@/context/BrandThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { cn } from "@/utils/cn";
import { SidebarItem } from "./SidebarItem";

interface SidebarProps {
  collapsed: boolean;
  onExpand: () => void;
}

export function Sidebar({ collapsed, onExpand }: SidebarProps) {
  const { t } = useLanguage();
  const { config } = useBrandTheme();
  const { user, can } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const variant = config.sidebar;
  // The icon rail is permanently collapsed by design.
  const isCollapsed = variant === "rail" ? true : collapsed;

  const [expandedItems, setExpandedItems] = useState<ReadonlySet<string>>(
    () => new Set(["analytics"]),
  );
  const [promoDismissed, setPromoDismissed] = useState(false);
  const Logo = DashboardConfig.logo;

  const toggleExpanded = useCallback((itemId: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }, []);

  /**
   * Only sections/items the user may access.
   * Submenus are filtered too, and empty sections disappear entirely.
   */
  const visibleSections = useMemo(
    () =>
      MENU_SECTIONS.map((section) => ({
        ...section,
        items: section.items
          .filter((item) => can(item.permission))
          .map((item) => ({
            ...item,
            submenu: item.submenu?.filter((sub) => can(sub.permission)),
          })),
      })).filter((section) => section.items.length > 0),
    [can],
  );

  // Keep the parent of the active submenu route expanded while navigating.
  useEffect(() => {
    const parent = visibleSections.flatMap((s) => s.items).find((item) =>
      item.submenu?.some((sub) => sub.path === pathname),
    );
    if (parent) setExpandedItems((prev) => new Set(prev).add(parent.id));
  }, [pathname, visibleSections]);

  // To show a promotion for SaaS projects, remove the `false` and use the real condition.
  const showPromo = !isCollapsed && !promoDismissed && variant !== "rail" && false;

  return (
    <aside
      className={cn(
        "z-20 hidden shrink-0 flex-col transition-[width] duration-300 ease-in-out lg:flex",
        isCollapsed ? "w-20" : "w-72",
        variant === "floating"
          ? "surface-card m-3 h-[calc(100%-1.5rem)] overflow-hidden"
          : "h-full border-e border-slate-200/60 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/80",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-[4.5rem] items-center gap-3 border-b border-slate-200/60 dark:border-slate-800/80",
          isCollapsed ? "justify-center px-2" : "px-5",
        )}
      >
        <div className="grid size-10 shrink-0 place-items-center rounded-icon bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-600/25">
          <Logo className="size-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="min-w-0">
            <h1 className="font-display text-lg font-bold leading-tight text-slate-900 dark:text-white">
              {t("general.app.name")}
            </h1>
            <p className="text-[11px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500">
              {t("general.app.tagline")}
            </p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {visibleSections.map((section) => (
          <div key={section.id} className="space-y-1 pb-2">
            {!isCollapsed && (
              <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {t(`general.nav.sections.${section.id}`)}
              </p>
            )}
            {isCollapsed && section.id !== visibleSections[0]?.id && (
              <div className="mx-2 my-3 h-px bg-slate-200/80 dark:bg-slate-800" />
            )}
            {section.items.map((item) => (
              <SidebarItem
                key={item.id}
                item={item}
                collapsed={isCollapsed}
                currentPath={pathname}
                expanded={expandedItems.has(item.id)}
                onToggleExpand={toggleExpanded}
                onExpandSidebar={onExpand}
              />
            ))}
          </div>
        ))}
      </nav>

      {/* Promo card */}
      <AnimatePresence initial={false}>
        {showPromo && (
          <motion.div
            key="promo"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden px-3"
          >
            <div className="relative mb-3 overflow-hidden rounded-card bg-gradient-to-br from-brand-600 to-accent-600 p-4 text-white">
              <div className="absolute -end-6 -top-6 size-24 rounded-full bg-white/10 blur-xl" />
              <button
                type="button"
                aria-label={t("general.promo.dismiss")}
                onClick={() => setPromoDismissed(true)}
                className="absolute end-2.5 top-2.5 grid size-6 place-items-center rounded-md text-white/70 transition-colors hover:bg-white/15 hover:text-white"
              >
                <X className="size-3.5" />
              </button>
              <span className="grid size-9 place-items-center rounded-icon bg-white/15">
                <Rocket className="size-4" />
              </span>
              <p className="mt-3 font-display text-sm font-bold">{t("general.promo.title")}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/75">{t("general.promo.body")}</p>
              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="mt-3 w-full rounded-control bg-white py-2 text-xs font-bold text-brand-700 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {t("general.promo.cta")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current user */}
      <div
        className={cn(
          "border-t border-slate-200/60 p-3 dark:border-slate-800/80",
          isCollapsed && "flex justify-center",
        )}
      >
        {isCollapsed ? (
          user?.image ? (
            <img
              src={user.image}
              alt={user.name}
              title={user.name}
              className="size-10 rounded-full object-cover ring-2 ring-brand-500/50"
            />
          ) : (
            <InitialsAvatar name={user?.name ?? ""} className="size-10 text-xs ring-2 ring-brand-500/40" />
          )
        ) : (
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="flex w-full items-center gap-3 rounded-control bg-slate-100/70 p-3 text-start transition-colors hover:bg-slate-200/70 dark:bg-slate-800/50 dark:hover:bg-slate-800"
          >
            {user?.image ? (
              <img
                src={user.image}
                alt={user.name}
                className="size-10 shrink-0 rounded-full object-cover ring-2 ring-brand-500/50"
              />
            ) : (
              <InitialsAvatar name={user?.name ?? ""} className="size-10 shrink-0 text-xs ring-2 ring-brand-500/40" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                {user?.name}
              </p>
              <p className="truncate text-xs capitalize text-slate-500 dark:text-slate-400">
                {user?.roles?.[0] ?? user?.email}
              </p>
            </div>
            <span
              className="size-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20"
              title={t("general.promo.online")}
            />
          </button>
        )}
      </div>
    </aside>
  );
}
