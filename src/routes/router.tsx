/**
 * Builds the react-router instance from the declarative route config.
 *
 *  - `publicRoutes`  → rendered bare (no chrome), wrapped in <GuestOnly>
 *  - `routes`        → rendered inside <AppLayout>, wrapped in <RequireAuth>
 */

import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { NotFound } from "@/components/pages/NotFound";
import { GuestOnly, RequireAuth, RequirePermission } from "@/routes/guards";
import { publicRoutes, routes, type AppRoute } from "@/routes/routes";
import { LoadingScreen } from "@/components/ui/Loading";

export const router = createBrowserRouter([
  /* ---------- Public (auth) routes — no sidebar/header ---------- */
  ...publicRoutes.map((route: AppRoute) => ({
    path: route.path,
    element: (
      <GuestOnly>
        <Suspense fallback={<LoadingScreen />}>
          <route.element {...(route.props ?? {})} />
        </Suspense>
      </GuestOnly>
    ),
  })),

  /* ---------- Protected dashboard routes ---------- */
  {
    path: "/",
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      ...routes.map((route) => ({
        path: route.path,
        element: (
          <RequirePermission permission={route.permission}>
            <route.element {...(route.props ?? {})} />
          </RequirePermission>
        ),
      })),
      { path: "*", element: <NotFound /> },
    ],
  },
]);
