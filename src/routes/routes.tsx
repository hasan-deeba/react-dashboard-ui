/**
 * Application Routes Configuration
 *
 * Pure metadata configuration for application routes — no JSX, no side
 * effects:
 *
 *   - `nameKey`     → i18n key for the page title (dotted namespace format)
 *   - `element`     → lazy-loaded view component
 *   - `permission`  → required permission (enforced by RequirePermission)
 *   - `public`      → route skips auth (login/register)
 *   - `hideChrome`  → rendered without sidebar + header
 *
 * @module routes
 */

import { lazy, type ComponentType } from "react";

/* Dashboard */
const Dashboard = lazy(() =>
  import("@/components/dashboard/Dashboard").then((m) => ({ default: m.Dashboard })),
);

/* Appearance */
const ThemeStudio = lazy(() =>
  import("@/components/pages/ThemeStudio").then((m) => ({ default: m.ThemeStudio })),
);

/* Resource pages (DataTable-driven) */
const UsersList = lazy(() => import("@/views/users/List"));
const UserForm = lazy(() => import("@/views/users/Form"));
const UserShow = lazy(() => import("@/views/users/Show"));

/* Roles & permissions */
const RolesList = lazy(() => import("@/views/roles/List"));
const RoleForm = lazy(() => import("@/views/roles/Form"));
const RoleShow = lazy(() => import("@/views/roles/Show"));

/* Activity log — one table, scoped by route props (see the view's doc). */
const ActivityLogList = lazy(() => import("@/views/activityLogs/List"));

/* Auth */
const Login = lazy(() => import("@/views/auth/Login"));
const Register = lazy(() => import("@/views/auth/Register"));

/* Account */
const Profile = lazy(() => import("@/views/profile/Profile"));

/* Settings (singleton resource) */
const Settings = lazy(() => import("@/views/settings/Settings"));

/* Placeholder for sections not built yet */
const ComingSoon = lazy(() =>
  import("@/components/pages/ComingSoon").then((m) => ({ default: m.ComingSoon })),
);

/* Views may declare their own props (e.g. ComingSoon's titleKey). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type RouteView = ComponentType<any>;

export interface AppRoute {
  path: string;
  /** i18n key resolved for the page title / breadcrumbs. */
  nameKey: string;
  element: RouteView;
  /** Extra props forwarded to the view element. */
  props?: Record<string, unknown>;
  /** Permission required to open the route. */
  permission?: string;
  /** Route is accessible without authentication. */
  public?: boolean;
  /** Hide the sidebar + header chrome (auth screens). */
  hideChrome?: boolean;
}

/** Auth screens — rendered without the dashboard chrome. */
export const publicRoutes: AppRoute[] = [
  { path: "/login", nameKey: "auth.login.title", element: Login, public: true, hideChrome: true },
  { path: "/register", nameKey: "auth.register.title", element: Register, public: true, hideChrome: true },
];

export const routes: AppRoute[] = [
  /* ---------- Dashboard ---------- */
  { path: "/dashboard", nameKey: "general.nav.dashboard", element: Dashboard },

  /* ---------- Account ---------- */
  { path: "/profile", nameKey: "general.nav.profile", element: Profile },

  /* ---------- Analytics ---------- */
  { path: "/analytics/overview", nameKey: "general.nav.analytics-overview", element: ComingSoon, props: { titleKey: "general.nav.analytics-overview" } },
  { path: "/analytics/reports", nameKey: "general.nav.analytics-reports", element: ComingSoon, props: { titleKey: "general.nav.analytics-reports" } },
  { path: "/analytics/insights", nameKey: "general.nav.analytics-insights", element: ComingSoon, props: { titleKey: "general.nav.analytics-insights" } },

  /* ---------- Users ---------- */
  { path: "/users", nameKey: "users.plural", element: UsersList, permission: "users.view" },
  { path: "/users/create", nameKey: "users.singular", element: UserForm, permission: "users.create" },
  { path: "/users/:id/edit", nameKey: "users.singular", element: UserForm, permission: "users.edit" },
  { path: "/users/:id", nameKey: "users.singular", element: UserShow, permission: "users.view" },

  /* ---------- Roles & permissions (Spatie) ---------- */
  { path: "/roles", nameKey: "roles.plural", element: RolesList, permission: "roles.view" },
  { path: "/roles/create", nameKey: "roles.singular", element: RoleForm, permission: "roles.create" },
  { path: "/roles/:id/edit", nameKey: "roles.singular", element: RoleForm, permission: "roles.edit" },
  { path: "/roles/:id", nameKey: "roles.singular", element: RoleShow, permission: "roles.view" },

  /* ---------- Activity log (one component, three scopes) ---------- */
  { path: "/activity-logs", nameKey: "activityLogs.title", element: ActivityLogList, permission: "activity_logs.view" },
  { path: "/users/:id/logs", nameKey: "activityLogs.userTitle", element: ActivityLogList, props: { scope: "causer" }, permission: "activity_logs.view" },
  { path: "/roles/:id/logs", nameKey: "activityLogs.recordTitle", element: ActivityLogList, props: { scope: "subject", subjectType: "Role" }, permission: "activity_logs.view" },

  /* ---------- General ---------- */
  { path: "/appearance", nameKey: "general.nav.appearance", element: ThemeStudio },
  { path: "/settings", nameKey: "settings.plural", element: Settings, permission: "settings.view" },
  { path: "/help", nameKey: "general.nav.help", element: ComingSoon, props: { titleKey: "general.nav.help" } },
];

export default routes
