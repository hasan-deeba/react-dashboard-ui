import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { menuLabelKey, type MenuItem } from "@/data/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

interface SidebarItemProps {
  item: MenuItem;
  collapsed: boolean;
  currentPath: string;
  expanded: boolean;
  onToggleExpand: (id: string) => void;
  onExpandSidebar: () => void;
}

export function SidebarItem({
  item,
  collapsed,
  currentPath,
  expanded,
  onToggleExpand,
  onExpandSidebar,
}: SidebarItemProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const label = t(menuLabelKey(item));
  const isActive = currentPath === item.path;
  const childActive = item.submenu?.some((sub) => sub.path === currentPath) ?? false;
  const Icon = item.icon;

  const handleClick = () => {
    if (!item.submenu) {
      navigate(item.path);
      return;
    }
    // In the collapsed rail, expand the sidebar first so the submenu is visible.
    if (collapsed) onExpandSidebar();
    onToggleExpand(item.id);
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        title={collapsed ? label : undefined}
        aria-expanded={item.submenu ? expanded : undefined}
        className={cn(
          "relative flex w-full items-center gap-3 rounded-control px-3 py-[var(--pad-nav-y)] text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
          isActive
            ? "text-white"
            : childActive
              ? "text-brand-600 hover:bg-brand-500/[0.07] dark:text-brand-400 dark:hover:bg-brand-500/10"
              : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100",
        )}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-active-pill"
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="absolute inset-0 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 shadow-lg shadow-brand-600/25"
          />
        )}

        <Icon className="relative z-10 size-5 shrink-0" />

        {!collapsed && (
          <>
            <span className="relative z-10 flex-1 truncate text-start">{label}</span>

            {item.badge && (
              <span
                className={cn(
                  "relative z-10 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-rose-500/15 text-rose-500 dark:text-rose-400",
                )}
              >
                {t(`general.badges.${item.badge}`)}
              </span>
            )}

            {item.count && (
              <span
                className={cn(
                  "relative z-10 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-200/70 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                )}
              >
                {item.count}
              </span>
            )}

            {item.submenu && (
              <ChevronDown
                className={cn(
                  "relative z-10 size-4 shrink-0 opacity-60 transition-transform duration-300",
                  expanded && "rotate-180",
                )}
              />
            )}
          </>
        )}
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && item.submenu && expanded && (
          <motion.ul
            key="submenu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
            className="overflow-hidden"
          >
            {item.submenu.map((sub) => {
              const subActive = currentPath === sub.path;
              return (
                <li key={sub.id}>
                  <button
                    type="button"
                    onClick={() => navigate(sub.path)}
                    className={cn(
                      "relative mt-0.5 w-full rounded-control py-2 pe-3 ps-11 text-start text-[13px] transition-colors",
                      subActive
                        ? "bg-brand-500/[0.08] font-semibold text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
                        : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                    )}
                  >
                    {subActive && (
                      <motion.span
                        layoutId="sidebar-sub-indicator"
                        transition={{ type: "spring", stiffness: 500, damping: 36 }}
                        className="absolute start-6 top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-gradient-to-b from-brand-500 to-accent-500"
                      />
                    )}
                    {t(menuLabelKey(sub))}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
