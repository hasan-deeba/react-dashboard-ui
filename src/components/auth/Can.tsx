import type { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface CanProps {
  /** Single permission — omit to always render. */
  permission?: string;
  /** Render when the user has AT LEAST ONE of these. */
  any?: string[];
  /** Render when the user has ALL of these. */
  all?: string[];
  children: ReactNode;
  /** Shown when the check fails (defaults to nothing). */
  fallback?: ReactNode;
}

/**
 * Declarative permission gate for any piece of UI.
 *
 *   <Can permission="users.create"><NewUserButton /></Can>
 *   <Can any={["users.edit", "users.delete"]}>…</Can>
 */
export function Can({ permission, any, all, children, fallback = null }: CanProps) {
  const { can, canAny, canAll } = useAuth();

  const allowed =
    can(permission) &&
    (any ? canAny(any) : true) &&
    (all ? canAll(all) : true);

  return <>{allowed ? children : fallback}</>;
}
