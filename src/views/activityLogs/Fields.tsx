/**
 * Activity log declarations.
 *
 * PURPOSE : columns for the log table and the change-diff renderer.
 * EXPORTS : shortModel(), ActivityChangesTable(), buildActivityColumns().
 * EDIT    : the backend's `event_type.color` already uses our semantic tone
 *           names (success | danger | warning | info | primary | …), so it is
 *           passed straight to the badge column's `.tones()` map — do not
 *           re-map or re-style it here.
 */

import { column, type ColumnInput, type Tone } from "@/components/table";
import {
  activityColor,
  activityEvent,
  type ActivityChanges,
  type ActivityLog,
} from "@/types/models";

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** Model class name without its namespace: "App\Models\Role" → "Role". */
export function shortModel(subjectType?: string | null): string {
  if (!subjectType) return "";
  return subjectType.split("\\").pop() ?? subjectType;
}

/* --------------------------------- changes -------------------------------- */

/**
 * Recorded changes.
 * `type: "diff"` (updates) renders old → new; anything else renders a flat
 * attribute/value list (creates and deletes).
 */
export function ActivityChangesTable({
  changes,
  t,
}: {
  changes?: ActivityChanges;
  t: Translate;
}) {
  const data = changes ?? {};
  const items = data.items ?? [];
  const isDiff = data.type === "diff" || Boolean(data.old && data.attributes);

  if (items.length === 0) {
    return (
      <p className="rounded-control border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
        {t("activityLogs.noChanges")}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-control border border-slate-200 dark:border-slate-700">
      <table className="w-full text-start text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/60 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-500">
            <th className="px-3 py-2 text-start">{t("activityLogs.attribute")}</th>
            {isDiff ? (
              <>
                <th className="px-3 py-2 text-start">{t("activityLogs.originalValue")}</th>
                <th className="px-3 py-2 text-start">{t("activityLogs.newValue")}</th>
              </>
            ) : (
              <th className="px-3 py-2 text-start">{t("activityLogs.value")}</th>
            )}
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr
              key={`${item.field}-${index}`}
              className="border-b border-slate-100 last:border-0 dark:border-slate-800/60"
            >
              <td className="px-3 py-2 align-top text-xs font-bold text-slate-700 dark:text-slate-200">
                {item.field}
              </td>
              {isDiff ? (
                <>
                  <td className="px-3 py-2 align-top">
                    <span
                      dir="auto"
                      className="inline-block rounded bg-rose-500/10 px-1.5 py-0.5 text-xs text-rose-600 line-through decoration-rose-500/40 dark:text-rose-400"
                    >
                      {item.old_value ?? "—"}
                    </span>
                  </td>
                  <td className="px-3 py-2 align-top">
                    <span
                      dir="auto"
                      className="inline-block rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs text-emerald-600 dark:text-emerald-400"
                    >
                      {item.new_value ?? "—"}
                    </span>
                  </td>
                </>
              ) : (
                <td dir="auto" className="px-3 py-2 align-top text-xs text-slate-600 dark:text-slate-300">
                  {item.value ?? item.new_value ?? "—"}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* --------------------------------- columns -------------------------------- */

/**
 * Table columns — plain builders, same as users/roles.
 * `showSubject`/`showCauser` are false on a scoped log where every row shares
 * that value.
 */
export function buildActivityColumns({
  showSubject = true,
  showCauser = true,
}: { showSubject?: boolean; showCauser?: boolean } = {}): ColumnInput<ActivityLog>[] {
  const columns: ColumnInput<ActivityLog>[] = [
    // The API sends the tone name per row, so resolve it from the record.
    column
      .badge<ActivityLog>("event")
      .labelKey("activityLogs.event")
      .accessor((row) => activityEvent(row))
      .sortable()
      .tone((row) => (activityColor(row) || "default") as Tone),
  ];

  if (showCauser) {
    columns.push(
      column
        .avatar<ActivityLog>("causer")
        .labelKey("activityLogs.performedBy")
        .accessor((row) => row.causer?.name ?? row.causer?.email ?? "")
        .searchable()
        .description((row) => row.causer?.email),
    );
  }

  if (showSubject) {
    columns.push(
      column
        .text<ActivityLog>("subject_type")
        .labelKey("activityLogs.targetModel")
        .accessor((row) =>
          row.subject_type ? `${shortModel(row.subject_type)} #${row.subject_id ?? "—"}` : "",
        )
        .sortable()
        .hideBelow("md"),
    );
  }

  columns.push(column.date<ActivityLog>("created_at").labelKey("activityLogs.date").sortable());

  return columns;
}
