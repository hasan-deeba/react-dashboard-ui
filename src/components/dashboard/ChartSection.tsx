import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CATEGORY_SERIES, REVENUE_SERIES } from "@/data/dashboard";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { useBrandTheme } from "@/context/BrandThemeContext";
import { formatCompact, formatCurrency } from "@/lib/format";
import { cn } from "@/utils/cn";

const CARD = "surface-card p-[var(--pad-card)]";

/** Reads a resolved token colour from the document (kept in sync by applyTheme). */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

type Range = "6M" | "12M";

interface TooltipEntry {
  dataKey?: string | number;
  value?: number | string;
  color?: string;
}

function RevenueTooltip({
  active,
  payload,
  label,
  t,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  t: (key: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200/70 bg-white/95 px-3.5 py-2.5 shadow-xl shadow-slate-900/10 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
        {label ? t(`general.months.${label.toLowerCase()}`) : ""}
      </p>
      {payload.map((entry) => (
        <p
          key={String(entry.dataKey)}
          className="text-sm font-bold tabular-nums"
          style={{ color: entry.color }}
        >
          {formatCurrency(Number(entry.value))}
          <span className="ms-1.5 text-[10px] font-medium uppercase text-slate-400">
            {t(`dashboard.revenue.${String(entry.dataKey)}`)}
          </span>
        </p>
      ))}
    </div>
  );
}

function RevenueChart() {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [range, setRange] = useState<Range>("12M");
  const data = range === "6M" ? REVENUE_SERIES.slice(6) : REVENUE_SERIES;

  const { config } = useBrandTheme();
  const axisColor = theme === "dark" ? "#64748b" : "#94a3b8";
  const gridColor = theme === "dark" ? "rgba(148,163,184,0.12)" : "rgba(100,116,139,0.15)";
  // Chart series follow the active brand palette.
  const revenueColor = useMemo(
    () => token("--brand-500") || config.brandColor,
    [config.brandColor],
  );
  const expensesColor = useMemo(
    () => token("--accent-500") || config.accentColor,
    [config.accentColor],
  );

  return (
    <div className={cn(CARD, "xl:col-span-2")}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {t("dashboard.revenue.title")}
          </h2>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t("dashboard.revenue.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 sm:flex">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: revenueColor }} />
              {t("dashboard.revenue.revenue")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-full" style={{ background: expensesColor }} />
              {t("dashboard.revenue.expenses")}
            </span>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {(["6M", "12M"] as Range[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRange(option)}
                dir="ltr"
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-semibold transition-all",
                  range === option
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts stay LTR regardless of the UI direction */}
      <div dir="ltr" className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={revenueColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={revenueColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={expensesColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={expensesColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="4 6" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              dy={8}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(month: string) => t(`general.months.${month.toLowerCase()}`)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: axisColor, fontSize: 11 }}
              tickFormatter={(value: number) => formatCompact(value)}
            />
            <Tooltip
              cursor={{ stroke: axisColor, strokeDasharray: "4 4" }}
              content={<RevenueTooltip t={t} />}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              stroke={expensesColor}
              strokeWidth={2}
              fill="url(#gradExpenses)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={revenueColor}
              strokeWidth={2.5}
              fill="url(#gradRevenue)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CategoryDonut() {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(-1);
  const featured = activeIndex >= 0 ? CATEGORY_SERIES[activeIndex] : CATEGORY_SERIES[0];

  return (
    <div className={CARD}>
      <div className="mb-2">
        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
          {t("dashboard.categories.title")}
        </h2>
        <p className="text-xs text-slate-400 dark:text-slate-500">
          {t("dashboard.categories.subtitle")}
        </p>
      </div>

      <div dir="ltr" className="relative mx-auto h-52 max-w-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={CATEGORY_SERIES}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="88%"
              paddingAngle={4}
              cornerRadius={6}
              strokeWidth={0}
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              {CATEGORY_SERIES.map((slice, index) => (
                <Cell
                  key={slice.name}
                  fill={slice.color}
                  opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.3}
                  className="transition-opacity duration-200"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="font-display text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {formatCompact(featured.value)}%
            </p>
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              {t(`dashboard.categories.${featured.name}`)}
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {CATEGORY_SERIES.map((slice, index) => (
          <li
            key={slice.name}
            onMouseEnter={() => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors",
              activeIndex === index && "bg-slate-100/80 dark:bg-slate-800/60",
            )}
          >
            <span className="size-2.5 rounded-full" style={{ background: slice.color }} />
            <span className="flex-1 font-medium text-slate-600 dark:text-slate-300">
              {t(`dashboard.categories.${slice.name}`)}
            </span>
            <span className="font-semibold tabular-nums text-slate-800 dark:text-slate-100">
              {slice.value}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartSection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="grid grid-cols-1 gap-4 sm:gap-5 xl:grid-cols-3"
    >
      <RevenueChart />
      <CategoryDonut />
    </motion.section>
  );
}
