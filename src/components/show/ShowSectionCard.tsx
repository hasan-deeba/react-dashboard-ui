import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";
import { renderShowValue } from "./ShowValue";
import type { ShowSection } from "./types";

/** One titled details card with a two-column definition grid. */
export function ShowSectionCard<T extends Record<string, unknown>>({
  section,
  record,
}: {
  section: ShowSection<T>;
  record: T;
}) {
  const { t } = useLanguage();

  return (
    <section className="surface-card p-[var(--pad-card)]">
      {(section.title || section.titleKey) && (
        <h2 className="mb-4 font-display text-base font-bold text-slate-900 dark:text-white">
          {section.titleKey ? t(section.titleKey) : section.title}
        </h2>
      )}

      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
        {section.entries.map((entry) => (
          <div
            key={entry.key}
            className={cn(
              "min-w-0 border-b border-slate-100 pb-4 last:border-0 dark:border-slate-800/60",
              entry.full && "sm:col-span-2",
            )}
          >
            {(entry.label || entry.labelKey) && (
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                {entry.labelKey ? t(entry.labelKey) : entry.label}
              </dt>
            )}
            <dd className="mt-1.5 break-words text-sm text-slate-700 dark:text-slate-200">
              {renderShowValue({ entry, record, t })}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
