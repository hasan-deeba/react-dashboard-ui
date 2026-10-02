import { useId } from "react";
import { motion, type Variants } from "framer-motion";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import type { Stat } from "@/data/dashboard";
import { useCountUp } from "@/hooks/useCountUp";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const gradientId = useId();
  const width = 96;
  const height = 36;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => [
    (index / (data.length - 1)) * width,
    height - 3 - ((value - min) / range) * (height - 6),
  ]);
  const line = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;
  const color = positive ? "#10b981" : "#f43f5e";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-24" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

interface StatCardProps {
  stat: Stat;
  index: number;
}

export function StatCard({ stat, index }: StatCardProps) {
  const { t, locale } = useLanguage();
  const animated = useCountUp(stat.value, 1400, 150 + index * 120);
  const positive = stat.change >= 0;
  const TrendIcon = positive ? ArrowUpRight : ArrowDownRight;

  const decimals = stat.decimals ?? 0;
  const formatted = `${stat.prefix ?? ""}${animated.toLocaleString(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}${stat.suffix ?? ""}`;

  const Icon = stat.icon;

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ y: -4 }}
      className="surface-card group relative overflow-hidden p-[var(--pad-card)] transition-shadow hover:shadow-lg hover:shadow-slate-900/[0.06] dark:hover:shadow-black/30"
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-icon bg-gradient-to-br text-white shadow-lg",
            stat.gradient,
          )}
        >
          <Icon className="size-5" />
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-0.5 rounded-full px-2 py-1 text-xs font-bold tabular-nums",
            positive
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
          )}
        >
          <TrendIcon className="size-3.5" />
          {Math.abs(stat.change)}%
        </span>
      </div>

      <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
        {t(`dashboard.stats.${stat.id}`)}
      </p>

      <div className="mt-1 flex items-end justify-between gap-2">
        <p className="font-display text-[1.65rem] font-bold leading-none tracking-tight text-slate-900 tabular-nums dark:text-white">
          {formatted}
        </p>
        <Sparkline data={stat.spark} positive={positive} />
      </div>

      <p className="mt-2 text-[11px] font-medium text-slate-400 dark:text-slate-500">
        {t("dashboard.stats.vsLastMonth")}
      </p>
    </motion.div>
  );
}
