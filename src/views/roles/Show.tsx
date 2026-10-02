/**
 * Role detail page (/roles/:id).
 *
 * PURPOSE : header + grouped permissions + an aside listing the users who
 *           hold the role and a link to the role's activity history.
 * EDIT    : labels come from the `roles` namespace via useModelTranslation;
 *           permission names are grouped by prefix for display only.
 */

import { useMemo } from "react";
import { History, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { DynamicShow, type ShowSection } from "@/components/show";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { useLanguage } from "@/context/LanguageContext";
import { useModelTranslation, type ModelTranslation } from "@/hooks/useModelTranslation";
import { resourcePaths } from "@/lib/paths";
import { cn } from "@/utils/cn";
import { refName, type Role, type User } from "@/types/models";

function groupPermissions(role: Role): Array<{ group: string; items: string[] }> {
  const names = (role.permissions ?? []).map(refName).filter(Boolean);
  const map = new Map<string, string[]>();
  for (const name of names) {
    const [group, ...rest] = name.split(".");
    const key = rest.length > 0 ? group : "general";
    const label = rest.length > 0 ? rest.join(".") : name;
    map.set(key, [...(map.get(key) ?? []), label]);
  }
  return [...map.entries()].map(([group, items]) => ({ group, items }));
}

/** Aside: users holding this role + a shortcut to the role's history. */
function RoleAside({ role, m }: { role: Role; m: ModelTranslation }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const userPaths = resourcePaths("users");
  const rolePaths = resourcePaths("roles");
  const users = role.users;

  return (
    <>
      <section className="surface-card p-[var(--pad-card)]">
        <h2 className="flex items-center gap-2 font-display text-base font-bold text-slate-900 dark:text-white">
          <UsersIcon className="size-4 text-slate-400" />
          {m.key("users")}
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {m.key("usersCountLabel", { count: users?.length ?? 0 })}
        </p>

        {!users || users.length === 0 ? (
          <p className="mt-5 rounded-control border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
            {m.key("noUsers")}
          </p>
        ) : (
          <ul className="mt-4 max-h-96 space-y-1 overflow-y-auto">
            {users.map((user: User) => (
              <li key={String(user.id)}>
                <button
                  type="button"
                  onClick={() => navigate(userPaths.show(user.id))}
                  className="flex w-full items-center gap-3 rounded-control px-2 py-2 text-start transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt=""
                      className="size-9 shrink-0 rounded-full object-cover ring-2 ring-brand-500/25"
                    />
                  ) : (
                    <InitialsAvatar name={user.name} className="size-9 text-xs" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {user.name}
                    </span>
                    <span className="block truncate text-xs text-slate-400 dark:text-slate-500">
                      {user.email}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "size-2 shrink-0 rounded-full",
                      user.is_active ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600",
                    )}
                  />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="surface-card p-[var(--pad-card)]">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
          {t("activityLogs.recordTitle")}
        </h2>
        <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
          {t("activityLogs.description")}
        </p>
        <button
          type="button"
          onClick={() => navigate(rolePaths.logs(role.id))}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-control border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <History className="size-3.5" />
          {t("activityLogs.viewLogs")}
        </button>
      </section>
    </>
  );
}

export default function RoleShow() {
  const { id } = useParams<{ id: string }>();
  const m = useModelTranslation("roles");

  type RoleRecord = Role & Record<string, unknown>;

  const sections = useMemo<ShowSection<RoleRecord>[]>(
    () => [
      {
        entries: [
          {
            key: "permissions",
            type: "custom",
            full: true,
            label: m.field("permissions"),
            render: (role) => {
              const groups = groupPermissions(role);
              if (groups.length === 0) {
                return (
                  <p className="rounded-control border border-dashed border-slate-200 px-4 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
                    {m.key("noPermissions")}
                  </p>
                );
              }
              return (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {m.key("permissionsCountLabel", {
                      count: (role.permissions ?? []).length,
                    })}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {groups.map((group) => (
                      <div
                        key={group.group}
                        className="rounded-control border border-slate-200 p-3 dark:border-slate-700"
                      >
                        <p className="mb-2 flex items-center gap-2 text-sm font-bold capitalize text-slate-800 dark:text-slate-100">
                          <ShieldCheck className="size-3.5 text-brand-500" />
                          {group.group}
                          <span className="ms-auto text-[11px] font-semibold tabular-nums text-slate-400">
                            {group.items.length}
                          </span>
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {group.items.map((item) => (
                            <span
                              key={item}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            },
          },
        ],
      },
    ],
    [m],
  );

  return (
    <DynamicShow<RoleRecord>
      resource="roles"
      recordId={id}
      sections={sections}
      header={(role) => ({
        title: role.name,
        subtitle: m.key("summary", {
          permissions: (role.permissions ?? []).length,
          users: role.users?.length ?? 0,
        }),
        icon: ShieldCheck,
      })}
      aside={(role) => <RoleAside role={role} m={m} />}
    />
  );
}
