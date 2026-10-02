/**
 * Activity log table — one component, three scopes.
 *
 * PURPOSE : renders `GET activity-logs`, optionally narrowed to a causer
 *           (everything a user did) or a subject (everything done to a
 *           record). The scope comes from route props, so there is a single
 *           table implementation for all three entry points.
 * EXPORTS : default ActivityLogList.
 * EDIT    : scopes are wired in `src/routes/routes.tsx`:
 *             /activity-logs              → (no props)      all logs
 *             /users/:id/logs             → scope="causer"  that user's actions
 *             /roles/:id/logs             → scope="subject" + subjectType="Role"
 *           Filter keys (causer_id / subject_type / subject_id) must exist in
 *           the backend's allowedAdvanceSearchColumns.
 */

import { useMemo, useState } from "react";
import { History, ScrollText } from "lucide-react";
import { useParams } from "react-router-dom";
import { DataTable, type BaseFilter } from "@/components/table";
import { useLanguage } from "@/context/LanguageContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { activityEvent, type ActivityLog } from "@/types/models";
import { buildActivityColumns, ActivityChangesTable, shortModel } from "./Fields";

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** "created · by Jane · Role #3" — context line above the diff. */
function subtitleFor(log: ActivityLog, t: Translate): string {
  const parts = [activityEvent(log)];
  const who = log.causer?.name ?? log.causer?.email;
  parts.push(who ? t("activityLogs.byWhom", { name: who }) : t("activityLogs.system"));
  if (log.subject_type) parts.push(`${shortModel(log.subject_type)} #${log.subject_id ?? "—"}`);
  if (log.created_at) parts.push(String(log.created_at));
  return parts.filter(Boolean).join(" · ");
}

interface ActivityLogListProps {
  /** Omit for the global log. */
  scope?: "causer" | "subject";
  /** Required with scope="subject" — the Eloquent model name, e.g. "Role". */
  subjectType?: string;
  /** Overrides the record id taken from the route. */
  recordId?: string | number;
}

export default function ActivityLogList({ scope, subjectType, recordId }: ActivityLogListProps) {
  const { t } = useLanguage();
  const { id: routeId } = useParams<{ id: string }>();
  const id = recordId ?? routeId;

  /** Row opened in the detail modal. */
  const [selected, setSelected] = useState<ActivityLog | null>(null);

  /** Scoping filters — always sent, never shown in the toolbar. */
  const baseFilters = useMemo<BaseFilter[]>(() => {
    if (!scope || !id) return [];
    if (scope === "causer") return [{ key: "causer_id", value: String(id) }];
    return [
      { key: "subject_id", value: String(id) },
      ...(subjectType ? [{ key: "subject_type", value: subjectType }] : []),
    ];
  }, [scope, subjectType, id]);

  const columns = useMemo(
    () =>
      buildActivityColumns({
        // On a scoped log every row shares the same subject/causer.
        showSubject: scope !== "subject",
        showCauser: scope !== "causer",
      }),
    [scope],
  );

  const titleKey =
    scope === "causer"
      ? "activityLogs.userTitle"
      : scope === "subject"
        ? "activityLogs.recordTitle"
        : "activityLogs.title";

  return (
    <>
      <DataTable<ActivityLog>
        resource="activity-logs"
        columns={columns}
        baseFilters={baseFilters}
        getRowId={(row) => String(row.id)}
        titleKey={titleKey}
        descriptionKey="activityLogs.description"
        initialSort={{ key: "created_at", direction: "desc" }}
        exportable
        exportFileName="activity-logs.csv"
        emptyIcon={ScrollText}
        emptyTitle={t("activityLogs.empty")}
        emptyDescription={t("activityLogs.emptyBody")}
        onRowClick={(row) => setSelected(row)}
        rowActions={[
          {
            id: "view",
            labelKey: "activityLogs.viewChanges",
            icon: History,
            onClick: (row) => setSelected(row),
          },
        ]}
      />

      {/* Detail — the diff is the whole story, so a modal beats a page. */}
      <ConfirmModal
        open={selected !== null}
        title={t("activityLogs.changesTitle")}
        description={selected ? subtitleFor(selected, t) : undefined}
        confirmLabel={t("activityLogs.close")}
        hideCancel
        size="lg"
        tone="primary"
        onConfirm={() => setSelected(null)}
        onCancel={() => setSelected(null)}
        body={
          selected ? (
            <ActivityChangesTable changes={selected.changes ?? selected.properties} t={t} />
          ) : null
        }
      />
    </>
  );
}
