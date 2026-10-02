import { Menu } from "lucide-react";

import { DashboardConfig } from "@/config/DashboardConfig";

import { useAuth } from "@/context/AuthContext";
import { useBrandTheme } from "@/context/BrandThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useNotifications } from "@/hooks/useNotifications";
import { Breadcrumbs, useBreadcrumbs } from "./Breadcrumbs";
import { NotificationsMenu } from "./notification/NotificationsMenu";
import { IconButton } from "@/components/ui/IconButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SearchBar } from "./SearchBar";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import { cn } from "@/utils/cn";

interface HeaderProps {
  onToggleSidebar: () => void;
}

type GreetingKey = "morning" | "afternoon" | "evening";

function getGreetingKey(): GreetingKey {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export function Header({ onToggleSidebar }: HeaderProps) {
  const { t } = useLanguage();
  const { config } = useBrandTheme();
  const { user } = useAuth();
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead, markAllAsRead, dismiss } =
    useNotifications();

  const variant = config.header;
  const firstName = (user?.name ?? "").split(" ")[0];
  const greeting = t(`header.greeting.${getGreetingKey()}`);
  const Logo = DashboardConfig.logo;

  // Derived from the URL — see components/layout/header/Breadcrumbs.
  const crumbs = useBreadcrumbs();
  const breadcrumb = <Breadcrumbs />;

  /**
   * The page title is the last crumb, so detail/edit routes get a real name
   * (`#17`, `Edit`) instead of the nav fallback. Empty trail = dashboard.
   */
  const pageTitle =
    crumbs.length > 0 ? crumbs[crumbs.length - 1].label : t("general.nav.dashboard");

  const title = (
    <h1 className="font-display text-xl font-bold capitalize leading-tight text-slate-900 dark:text-white">
      {pageTitle}
    </h1>
  );

  const brandMark = (
    <div className="flex items-center gap-2.5">
      <span className="grid size-9 place-items-center rounded-icon bg-gradient-to-br from-brand-500 to-accent-500 shadow-lg shadow-brand-600/25">
        <Logo className="size-4 text-white" />
      </span>
      <span className="font-display text-lg font-bold text-slate-900 dark:text-white">
        {t("general.app.name")}
      </span>
    </div>
  );

  const actions = (
    <div className="flex items-center gap-1.5">
      <LanguageSwitcher />
      <ThemeToggle />
      <NotificationsMenu
        notifications={notifications}
        unreadCount={unreadCount}
        loading={notificationsLoading}
        onMarkAsRead={markAsRead}
        onMarkAllAsRead={markAllAsRead}
        onDismiss={dismiss}
      />
      <div className="mx-1.5 hidden h-6 w-px bg-slate-200 dark:bg-slate-700 sm:block" />
      <UserMenu />
    </div>
  );

  const menuButton = (
    <IconButton label={t("header.toggleSidebar")} onClick={onToggleSidebar} className="hidden lg:grid">
      <Menu className="size-5" />
    </IconButton>
  );

  const shell = cn(
    "relative z-30 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl",
    "dark:border-slate-800/80 dark:bg-slate-900/70",
  );

  /* ------------------------------- split ------------------------------- */
  if (variant === "split") {
    return (
      <header className={shell}>
        <div className="flex items-center gap-3 border-b border-slate-200/50 px-4 py-2 dark:border-slate-800/60 sm:px-6">
          {menuButton}
          {brandMark}
          <div className="flex-1" />
          {actions}
        </div>
        <div className="flex items-center gap-4 px-4 py-2.5 sm:px-6">
          <div className="min-w-0">
            {breadcrumb}
            <p className="truncate font-display text-sm font-bold capitalize text-slate-900 dark:text-white">
              {pageTitle}
            </p>
          </div>
          <div className="flex-1" />
          <SearchBar />
        </div>
      </header>
    );
  }

  /* ------------------------------ minimal ------------------------------ */
  if (variant === "minimal") {
    return (
      <header className={cn(shell, "px-4 py-2.5 sm:px-6")}>
        <div className="flex items-center gap-3 sm:gap-4">
          {menuButton}
          <div className="lg:hidden">{brandMark}</div>
          <p className="hidden truncate font-display text-base font-bold capitalize text-slate-900 lg:block dark:text-white">
            {pageTitle}
          </p>
          <div className="flex-1" />
          <SearchBar />
          {actions}
        </div>
      </header>
    );
  }

  /* ------------------------------ standard ----------------------------- */
  return (
    <header className={cn(shell, "px-4 py-3.5 sm:px-6")}>
      <div className="flex items-center gap-3 sm:gap-4">
        {menuButton}
        <div className="lg:hidden">{brandMark}</div>

        <div className="hidden min-w-0 lg:block">
          {breadcrumb}
          {title}
          <p className="hidden truncate text-xs text-slate-500 dark:text-slate-400 xl:block">
            {t("header.welcome", { greeting, name: firstName })}
          </p>
        </div>

        <div className="flex-1" />
        <SearchBar />
        {actions}
      </div>

      {/* Small screens lose the header block above, so keep the trail here. */}
      <div className="mt-2 lg:hidden">{breadcrumb}</div>
    </header>
  );
}
