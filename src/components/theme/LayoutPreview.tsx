import type { HeaderVariant, SidebarVariant } from "@/theme/types";
import { cn } from "@/utils/cn";

/**
 * Tiny schematic of a dashboard layout, used inside preset cards and the
 * layout pickers so the choice is understandable at a glance.
 */
export function LayoutPreview({
  sidebar,
  header,
  active,
  className,
}: {
  sidebar: SidebarVariant;
  header: HeaderVariant;
  active?: boolean;
  className?: string;
}) {
  const bar = active ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-600";
  const block = active ? "bg-brand-500/25" : "bg-slate-200 dark:bg-slate-700";

  return (
    <div
      aria-hidden
      className={cn(
        "flex h-16 w-full gap-1 overflow-hidden rounded-control border p-1",
        active
          ? "border-brand-500/40 bg-brand-500/5"
          : "border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/50",
        className,
      )}
    >
      {/* Sidebar */}
      <div
        className={cn(
          "shrink-0",
          sidebar === "rail" ? "w-2" : "w-4",
          sidebar === "floating" ? "m-0.5 rounded-[3px]" : "rounded-[2px]",
          bar,
        )}
      />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {header === "split" ? (
          <>
            <div className={cn("h-1.5 w-full rounded-[2px]", bar)} />
            <div className={cn("h-1.5 w-2/3 rounded-[2px]", block)} />
          </>
        ) : (
          <div
            className={cn(
              "w-full rounded-[2px]",
              header === "minimal" ? "h-1.5" : "h-3",
              bar,
            )}
          />
        )}
        <div className="grid flex-1 grid-cols-3 gap-1">
          <div className={cn("rounded-[2px]", block)} />
          <div className={cn("rounded-[2px]", block)} />
          <div className={cn("rounded-[2px]", block)} />
        </div>
      </div>
    </div>
  );
}
