/**
 * Dashboard landing page.
 *
 * PURPOSE : composes the overview widgets. Stats and charts are demo data;
 *           RecentUsers and ActivityFeed read the live API.
 * EDIT    : widgets hide themselves when the user lacks their permission, so
 *           the grid must tolerate any of them rendering null.
 */

import ActivityFeed from "@/components/dashboard/ActivityFeed";
import RecentUsers from "@/components/dashboard/RecentUsers";
import { ChartSection } from "@/components/dashboard/ChartSection";
import { StatsGrid } from "@/components/dashboard/StatsGrid";

export function Dashboard() {
  return (
    <div className="space-y-[var(--gap-grid)]">
      <StatsGrid />
      <ChartSection />
      <div className="grid grid-cols-1 gap-[var(--gap-grid)] xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentUsers />
        </div>
        <ActivityFeed />
      </div>
    </div>
  );
}
