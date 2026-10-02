/**
 * Dashboard chrome: sidebar + header + scrolling main region.
 *
 * PURPOSE : owns scroll restoration, page transitions, and the crash guard.
 * EXPORTS : AppLayout (used as the router's root layout element).
 * EDIT    : the ErrorBoundary is keyed by pathname so a crash resets when
 *           navigating away; keep it OUTSIDE Suspense so lazy fallbacks
 *           don't trip it.
 */

import { Suspense, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { useBrandTheme } from "@/context/BrandThemeContext";
import { Header } from "@/components/layout/header/Header";
import { Sidebar } from "@/components/layout/sidebar/Sidebar";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingSection } from "@/components/ui/Loading";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);
  const { config } = useBrandTheme();

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

  // Scroll to top whenever the route changes.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="theme-fade min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Ambient background — tinted by the active brand colour */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 end-[-8rem] size-[26rem] rounded-full bg-brand-400/25 blur-3xl dark:bg-brand-600/10" />
        <div className="absolute bottom-[-8rem] start-1/4 size-[22rem] rounded-full bg-accent-400/25 blur-3xl dark:bg-accent-600/10" />
        <div className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_75%)]" />
      </div>

      <div className="relative flex h-screen overflow-hidden">
        <Sidebar
          collapsed={sidebarCollapsed}
          onExpand={() => setSidebarCollapsed(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Header onToggleSidebar={toggleSidebar} />

          <main ref={mainRef} className="flex-1 overflow-y-auto">
            <div
              className={`mx-auto max-w-[90rem] p-4 sm:p-6 ${
                config.density === "compact" ? "sm:p-4" : ""
              }`}
            >
              <ErrorBoundary key={pathname}>
                <Suspense fallback={<LoadingSection />}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={pathname}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <Outlet />
                    </motion.div>
                  </AnimatePresence>
                </Suspense>
              </ErrorBoundary>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
