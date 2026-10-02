/**
 * Sidebar navigation model.
 *
 * PURPOSE : declares the menu once; the sidebar, the ⌘K search and the
 *           header breadcrumbs all read from it.
 * EXPORTS : MenuItem, SubMenuItem, MenuSection, MENU_SECTIONS.
 * EDIT    : every entry needs three things to line up —
 *             1. `id`         → an i18n key at `general.nav.<id>` (en AND ar)
 *             2. `path`       → a matching route in `src/routes/routes.tsx`
 *             3. `permission` → the same permission as that route
 *           Items the user lacks permission for are hidden automatically;
 *           a section with no visible items disappears entirely.
 */

import {
  BarChart3,
  HelpCircle,
  LayoutDashboard,
  Palette,
  ScrollText,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface SubMenuItem {
  id: string;
  path: string;
  permission?: string;
  /** Full i18n key, e.g. "users.plural". Overrides `general.nav.<id>`. */
  labelKey?: string;
}

export interface MenuItem {
  id: string;
  path: string;
  icon: LucideIcon;
  /** i18n key under `general.badges.*`. */
  badge?: string;
  count?: string;
  permission?: string;
  /**
   * Full i18n key for the label — resource entries point at their model
   * namespace (`users.plural`) so the name is defined in exactly one place.
   * Falls back to `general.nav.<id>`.
   */
  labelKey?: string;
  submenu?: SubMenuItem[];
}

/** The label key for a menu entry (model namespace, else the nav default). */
export function menuLabelKey(entry: { id: string; labelKey?: string }): string {
  return entry.labelKey ?? `general.nav.${entry.id}`;
}

export interface MenuSection {
  id: string;
  items: MenuItem[];
}

export const MENU_SECTIONS: MenuSection[] = [
  {
    id: "menu",
    items: [
      { id: "dashboard", path: "/dashboard", icon: LayoutDashboard, badge: "new" },
      {
        id: "analytics",
        path: "/analytics/overview",
        icon: BarChart3,
        submenu: [
          { id: "analytics-overview", path: "/analytics/overview" },
          { id: "analytics-reports", path: "/analytics/reports" },
          { id: "analytics-insights", path: "/analytics/insights" },
        ],
      },
      // Resource entries take their label from the model namespace.
      {
        id: "users",
        path: "/users",
        icon: Users,
        labelKey: "users.plural",
        permission: "users.view",
      },
      {
        id: "roles",
        path: "/roles",
        icon: ShieldCheck,
        labelKey: "roles.plural",
        permission: "roles.view",
      },
      {
        id: "activity-logs",
        path: "/activity-logs",
        icon: ScrollText,
        labelKey: "activityLogs.title",
        permission: "activity_logs.view",
      },
    ],
  },
  {
    id: "general",
    items: [
      { id: "appearance", path: "/appearance", icon: Palette },
      {
        id: "settings",
        path: "/settings",
        icon: Settings,
        labelKey: "settings.plural",
        permission: "settings.view",
      },
      { id: "help", path: "/help", icon: HelpCircle },
    ],
  },
];

/*
 * Page titles and trails are derived from the URL by
 * `components/layout/header/Breadcrumbs`, so no lookup table is needed here.
 */
