import { ArrowLeft, Pencil } from "lucide-react";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";
import type { ShowHeaderData } from "./types";

interface ShowHeaderProps {
  /** Data from the resource's header() — image wins over icon, icon over initials. */
  summary: ShowHeaderData | null;
  /** Fallback when no header() is supplied. */
  fallbackTitle?: string;
  fallbackTitleKey?: string;
  onBack?: () => void;
  onEdit?: () => void;
}

/** The record header card: identifier + title/subtitle + actions. */
export function ShowHeader({
  summary,
  fallbackTitle,
  fallbackTitleKey,
  onBack,
  onEdit,
}: ShowHeaderProps) {
  const { t } = useLanguage();
  const Icon = summary?.icon;

  return (
    <div className="surface-card flex flex-wrap items-center gap-4 p-[var(--pad-card)]">
      {summary &&
        (summary.image ? (
          <img
            src={summary.image}
            alt={summary.title}
            className="size-16 shrink-0 rounded-full object-cover ring-4 ring-brand-500/20"
          />
        ) : Icon ? (
          <span
            className={cn(
              "grid size-16 shrink-0 place-items-center rounded-icon text-white shadow-lg shadow-brand-600/25",
              summary.iconClassName ?? "bg-gradient-to-br from-brand-500 to-accent-500",
            )}
          >
            <Icon className="size-7" />
          </span>
        ) : (
          <InitialsAvatar
            name={summary.title}
            className="size-16 text-lg ring-4 ring-brand-500/20"
          />
        ))}

      <div className="min-w-0 flex-1">
        <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
          {summary?.title ?? (fallbackTitleKey ? t(fallbackTitleKey) : fallbackTitle)}
        </h1>
        {summary?.subtitle && (
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">
            {summary.subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-control border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="size-3.5 rtl:-scale-x-100" />
            {t("show.back")}
          </button>
        )}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-3.5 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03]"
          >
            <Pencil className="size-3.5" />
            {t("show.edit")}
          </button>
        )}
      </div>
    </div>
  );
}
