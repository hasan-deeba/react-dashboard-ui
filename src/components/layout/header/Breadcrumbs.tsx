/**
 * Route breadcrumbs.
 *
 * PURPOSE : show where the user is and let them climb back. Built from the
 *           URL so every route gets a trail with no extra configuration.
 * EXPORTS : Breadcrumbs, useBreadcrumbs(), type Crumb.
 * EDIT    : a crumb is only a link when its path is a REAL route — a bare
 *           record id (`/users/17`) is, an action verb (`/users/17/edit`) is
 *           not. Labels resolve via:
 *             1. matching nav entry       → its labelKey (model namespace)
 *             2. `<segment>.plural`       → the model namespace itself,
 *                                           since namespace === URL segment
 *             3. general.crumbs.<segment> (verbs: create/edit/logs)
 *             4. raw segment, `#123` for ids
 *           Add new verbs to `general.crumbs` in BOTH locales.
 */

import { Fragment, useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { MENU_SECTIONS, menuLabelKey } from "@/data/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

export interface Crumb {
  label: string;
  /** Present only when the segment maps to a navigable route. */
  to?: string;
}

/** Segments that are actions, not pages — never linkable. */
const ACTION_SEGMENTS = new Set(["create", "edit", "logs"]);

/** Label key of the nav entry registered at this exact path, if any. */
function navLabelKeyForPath(path: string): string | undefined {
  for (const section of MENU_SECTIONS) {
    for (const item of section.items) {
      if (item.path === path) return menuLabelKey(item);
      const sub = item.submenu?.find((entry) => entry.path === path);
      if (sub) return menuLabelKey(sub);
    }
  }
  return undefined;
}

export function useBreadcrumbs(): Crumb[] {
  const { pathname } = useLocation();
  const { t, exists } = useLanguage();

  return useMemo(() => {
    const segments = pathname.split("/").filter(Boolean);

    // The dashboard is the home crumb; don't repeat it.
    if (segments.length === 0 || (segments.length === 1 && segments[0] === "dashboard")) {
      return [];
    }

    return segments.map((segment, index) => {
      const to = `/${segments.slice(0, index + 1).join("/")}`;
      const isLast = index === segments.length - 1;
      const isAction = ACTION_SEGMENTS.has(segment);
      const isRecordId = /^\d+$/.test(segment);

      /* -------------------------------- label ------------------------------- */
      const navKey = navLabelKeyForPath(to);
      // namespace === URL segment, so a resource names itself.
      const isResource = exists(`${segment}.plural`);
      let label: string;

      if (navKey) {
        label = t(navKey);
      } else if (isResource) {
        label = t(`${segment}.plural`);
      } else if (exists(`general.nav.${segment}`)) {
        label = t(`general.nav.${segment}`);
      } else if (exists(`general.crumbs.${segment}`)) {
        label = t(`general.crumbs.${segment}`);
      } else {
        label = isRecordId ? `#${segment}` : segment;
      }

      /* -------------------------------- link -------------------------------- */
      // Linkable when it resolves to a real route: a registered nav path, a
      // known resource root, or a record detail page (/users/17).
      const parentIsResource =
        index > 0 && exists(`${segments[index - 1]}.plural`);
      const navigable =
        !isLast &&
        !isAction &&
        (Boolean(navKey) || isResource || (isRecordId && parentIsResource));

      return { label, to: navigable ? to : undefined };
    });
  }, [pathname, t, exists]);
}

export function Breadcrumbs({ className }: { className?: string }) {
  const { t } = useLanguage();
  const crumbs = useBreadcrumbs();

  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label={t("general.crumbs.label")}
      className={cn(
        "flex flex-wrap items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500",
        className,
      )}
    >
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return (
          <Fragment key={`${crumb.label}-${index}`}>
            {index > 0 && (
              <ChevronRight className="size-3 shrink-0 opacity-60 rtl:-scale-x-100" />
            )}
            {crumb.to ? (
              <Link
                to={crumb.to}
                className="max-w-40 truncate transition-colors hover:text-brand-600 dark:hover:text-brand-400"
              >
                {crumb.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? "page" : undefined}
                className={cn("max-w-40 truncate", isLast && "text-brand-600 dark:text-brand-400")}
              >
                {crumb.label}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
