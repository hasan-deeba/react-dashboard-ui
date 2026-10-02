/**
 * Users table (/users) — server mode.
 *
 * PURPOSE : lists `GET users`; filter options come from `GET users/builder`.
 * EDIT    : filter `key`s are backend columns and must appear in the
 *           resource's allowedAdvanceSearchColumns. The delete flow lives in
 *           `useResourceTable`; labels come from `useModelTranslation`.
 */

import { useMemo } from "react";
import { Eye, History, Pencil, Trash2, UserPlus, Users as UsersIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable, column, type ColumnInput, type FilterDef } from "@/components/table";
import { useLanguage } from "@/context/LanguageContext";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { useResourceTable } from "@/hooks/useResourceTable";
import { resourcePaths } from "@/lib/paths";
import { resourcePermissions } from "@/lib/permissions";
import { refId, refName, type User } from "@/types/models";

export default function UsersList() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const m = useModelTranslation("users");
  const paths = resourcePaths("users");
  const perms = resourcePermissions("users");
  const { refreshKey, requestDelete, requestBulkDelete, toggleActive, confirmDialog } =
    useResourceTable<User>({ resource: "users" });

  const columns = useMemo<ColumnInput<User>[]>(
    () => [
      column
        .avatar<User>("name")
        .label(m.field("name"))
        .sortable()
        .searchable()
        .description((row) => row.email),

      // Roles arrive as ["admin"] or [{ id, name }]; names are localised.
      column
        .custom<User>("roles")
        .label(m.field("roles"))
        .accessor((row) => (row.roles ?? []).map(refName).join(", "))
        .searchable()
        .render((row) => {
          const roles = (row.roles ?? []).map(refName).filter(Boolean);
          if (roles.length === 0) return <span className="text-slate-300">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {roles.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold capitalize text-brand-600 ring-1 ring-inset ring-brand-500/20 dark:text-brand-400"
                >
                  {role}
                </span>
              ))}
            </div>
          );
        }),

      // Switch in the cell — CrudService::toggleActiveStatus, then refresh.
      column
        .toggle<User>("is_active")
        .label(m.field("isActive"))
        .align("center")
        .sortable()
        .onToggle((row) => toggleActive(row)),

      column
        .date<User>("created_at")
        .label(m.field("joined"))
        .sortable()
        .hideBelow("lg")
        .toggleable(),
    ],
    [m, toggleActive],
  );

  const filters = useMemo<FilterDef<User>[]>(
    () => [
      {
        // Pivot relation: the backend's multiple-select handler resolves
        // `roles` to whereHas('roles', …).
        key: "roles",
        label: m.field("roles"),
        accessor: (row) => refId(row.roles?.[0]),
        builderKey: "roles",
        filterType: "multiple-select",
        multiple: true,
      },
      {
        key: "is_active",
        label: m.field("isActive"),
        accessor: (row) => (row.is_active ? "1" : "0"),
        options: [
          { value: "1", label: m.key("values.active") },
          { value: "0", label: m.key("values.inactive") },
        ],
      },
    ],
    [m],
  );

  return (
    <>
      <DataTable<User>
        resource="users"
        columns={columns}
        filters={filters}
        getRowId={(row) => String(row.id)}
        title={m.listTitle}
        description={m.description}
        initialSort={{ key: "name", direction: "asc" }}
        selectable
        exportable
        exportMode="server"
        // Temporary: lets you test drag ordering before `sort_order` exists.
        reorderable
        emptyIcon={UsersIcon}
        emptyTitle={m.emptyTitle}
        emptyDescription={m.emptyBody}
        refreshKey={refreshKey}
        onRowClick={(row) => navigate(paths.show(row.id))}
        primaryAction={{
          label: m.createLabel,
          icon: UserPlus,
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
