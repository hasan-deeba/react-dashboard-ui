/**
 * Roles table (/roles) — server mode.
 *
 * EDIT    : the delete flow lives in `useResourceTable`; labels come from the
 *           `roles` locale namespace via `useModelTranslation`.
 */

import { useMemo } from "react";
import { Eye, History, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, column, type ColumnInput } from "@/components/table";
import { useLanguage } from "@/context/LanguageContext";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { useResourceTable } from "@/hooks/useResourceTable";
import { resourcePaths } from "@/lib/paths";
import { resourcePermissions } from "@/lib/permissions";
import type { Role } from "@/types/models";

export default function RolesList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const m = useModelTranslation("roles");
  const paths = resourcePaths("roles");
  const perms = resourcePermissions("roles");
  const { refreshKey, requestDelete, requestBulkDelete, confirmDialog } = useResourceTable<Role>({
    resource: "roles",
  });

  const columns = useMemo<ColumnInput<Role>[]>(
    () => [
      column
        .text<Role>("name")
        .label(m.field("name"))
        .sortable()
        .searchable()
        .render((row) => (
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 shrink-0 place-items-center rounded-icon bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <ShieldCheck className="size-4" />
            </span>
            <span className="font-semibold capitalize text-slate-800 dark:text-slate-100">
              {row.name}
            </span>
          </div>
        )),

      column
        .number<Role>("permissions_count")
        .label(m.field("permissionsCount"))
        .accessor((row) => row.permissions_count ?? row.permissions?.length ?? 0)
        .sortable()
        .align("center"),

      column
        .number<Role>("users_count")
        .label(m.field("usersCount"))
        .accessor((row) => row.users_count ?? row.users?.length ?? 0)
        .sortable()
        .align("center"),

      column
        .date<Role>("created_at")
        .label(m.field("created"))
        .sortable()
        .hideBelow("md")
        .toggleable(),
    ],
    [m],
  );

  return (
    <>
      <DataTable<Role>
        resource="roles"
        columns={columns}
        getRowId={(row) => String(row.id)}
        title={m.listTitle}
        description={m.description}
        initialSort={{ key: "name", direction: "asc" }}
        selectable
        exportable
        exportMode="server"
        emptyIcon={ShieldCheck}
        emptyTitle={m.emptyTitle}
        emptyDescription={m.emptyBody}
        refreshKey={refreshKey}
        onRowClick={(row) => navigate(paths.show(row.id))}
        primaryAction={{
          label: m.createLabel,
          icon: Plus,
          permission: perms.create,
          onClick: () => navigate(paths.create),
        }}
        rowActions={[
          {
            id: "view",
            label: m.action("view"),
            icon: Eye,
            permission: perms.view,
            onClick: (row) => navigate(paths.show(row.id)),
          },
          {
            id: "logs",
            label: t("activityLogs.viewLogs"),
            icon: History,
            tone: "info",
            permission: "activity_logs.view",
            onClick: (row) => navigate(paths.logs(row.id)),
          },
          {
            id: "edit",
            label: m.action("edit"),
            icon: Pencil,
            permission: perms.edit,
            onClick: (row) => navigate(paths.edit(row.id)),
          },
          {
            id: "delete",
            label: m.action("delete"),
            icon: Trash2,
            tone: "danger",
            permission: perms.delete,
            onClick: requestDelete,
          },
        ]}
        bulkActions={[
          {
            id: "delete",
            labelKey: "resources.bulk.delete",
            tone: "danger",
            permission: perms.delete,
            onClick: requestBulkDelete,
          },
        ]}
      />
      {confirmDialog}
    </>
  );
}
