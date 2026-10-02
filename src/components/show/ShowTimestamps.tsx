import { useLanguage } from "@/context/LanguageContext";

export interface ShowTimestampsProps {
  created?: string | null;
  updated?: string | null;
}

/** Small centered created/updated footer — values render as the backend sent them. */
export function ShowTimestamps({ created, updated }: ShowTimestampsProps) {
  const { t } = useLanguage();
  if (!created && !updated) return null;

  return (
    <div className="space-y-1 text-center">
      {created && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t("show.createdAt")}: {created}
        </p>
      )}
      {updated && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500">
          {t("show.updatedAt")}: {updated}
        </p>
      )}
    </div>
  );
}
