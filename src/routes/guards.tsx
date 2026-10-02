import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { DashboardConfig } from "@/config/DashboardConfig";
import { useAuth } from "@/context/AuthContext";
import { LoadingScreen } from "@/components/ui/Loading";
import { Forbidden } from "@/components/pages/Forbidden";

/** Blocks the dashboard for unauthenticated visitors (when enforced). */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();
  const location = useLocation();

  if (!DashboardConfig.requireAuth) return <>{children}</>;
  if (initializing) return <LoadingScreen />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

/**
 * Blocks a route when the user lacks its permission.
 * Super admins always pass (handled inside `can`).
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission?: string;
  children: ReactNode;
}) {
  const { can, initializing } = useAuth();

  if (!permission) return <>{children}</>;
  if (initializing) return <LoadingScreen />;
  if (!can(permission)) return <Forbidden />;
  return <>{children}</>;
}

/** Keeps signed-in users away from /login and /register. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();

  if (initializing) return <LoadingScreen />;
  if (isAuthenticated && DashboardConfig.requireAuth) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
