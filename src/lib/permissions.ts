/**
 * Permission naming + the core check.
 *
 * PURPOSE : mirror the backend's Spatie permission names ("users.view") in
 *           one place, and provide the single predicate every gate uses.
 * EXPORTS : ResourcePermissions, resourcePermissions(), permissionFor(),
 *           hasPermission().
 * EDIT    : `hasPermission` is consumed by AuthContext.can() — which powers
 *           route guards, the sidebar, table actions and <Can>. Changing its
 *           semantics changes access control everywhere.
 *           Two invariants: an undefined permission means "no restriction",
 *           and super admins always pass.
 */

export interface ResourcePermissions {
  view: string;
  create: string;
  edit: string;
  delete: string;
}

export function resourcePermissions(resource: string): ResourcePermissions {
  return {
    view: `${resource}.view`,
    create: `${resource}.create`,
    edit: `${resource}.edit`,
    delete: `${resource}.delete`,
  };
}

/** Any ad-hoc ability, e.g. permissionFor("users", "export") → "users.export". */
export const permissionFor = (resource: string, ability: string): string =>
  `${resource}.${ability}`;

export function hasPermission(
  granted: readonly string[],
  permission: string | undefined,
  isSuperAdmin = false,
): boolean {
  if (!permission) return true;
  if (isSuperAdmin) return true;
  return granted.includes(permission);
}
