import {
  Activity,
  DollarSign,
  ShoppingCart,
  Users,
  type LucideIcon,
} from "lucide-react";


/* ---------------------------------- Stats ---------------------------------- */

export interface Stat {
  id: string;
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  change: number; // percentage, signed
  icon: LucideIcon;
  gradient: string; // tailwind gradient classes for the icon well
  spark: number[];
}

export const STATS: Stat[] = [
  {
    id: "revenue",
    label: "Total Revenue",
    value: 84254,
    prefix: "$",
    change: 12.5,
    icon: DollarSign,
    gradient: "from-blue-500 to-indigo-600",
    spark: [32, 38, 35, 44, 41, 52, 48, 56, 54, 63, 61, 72],
  },
  {
    id: "users",
    label: "Active Users",
    value: 6431,
    change: 8.2,
    icon: Users,
    gradient: "from-violet-500 to-purple-600",
    spark: [22, 25, 24, 31, 29, 36, 34, 41, 39, 46, 52, 58],
  },
  {
    id: "orders",
    label: "Total Orders",
    value: 1842,
    change: -2.4,
    icon: ShoppingCart,
    gradient: "from-amber-500 to-orange-600",
    spark: [40, 38, 42, 37, 41, 36, 39, 34, 38, 33, 36, 32],
  },
  {
    id: "conversion",
    label: "Conversion Rate",
    value: 3.42,
    suffix: "%",
    decimals: 2,
    change: 0.8,
    icon: Activity,
    gradient: "from-emerald-500 to-teal-600",
    spark: [18, 20, 19, 23, 22, 25, 24, 27, 26, 29, 31, 33],
  },
];

/* ------------------------------ Revenue chart ------------------------------ */

export interface RevenuePoint {
  month: string;
  revenue: number;
  expenses: number;
}

export const REVENUE_SERIES: RevenuePoint[] = [
  { month: "Jan", revenue: 4200, expenses: 2600 },
  { month: "Feb", revenue: 5100, expenses: 2900 },
  { month: "Mar", revenue: 4700, expenses: 3100 },
  { month: "Apr", revenue: 6300, expenses: 3400 },
  { month: "May", revenue: 5800, expenses: 3200 },
  { month: "Jun", revenue: 7200, expenses: 3800 },
  { month: "Jul", revenue: 6900, expenses: 3600 },
  { month: "Aug", revenue: 8400, expenses: 4100 },
  { month: "Sep", revenue: 7900, expenses: 3900 },
  { month: "Oct", revenue: 9300, expenses: 4400 },
  { month: "Nov", revenue: 8900, expenses: 4200 },
  { month: "Dec", revenue: 11200, expenses: 4800 },
];

/* ----------------------------- Category donut ------------------------------ */

export interface CategorySlice {
  /** i18n key — translate via `t("dashboard.categories.<name>")`. */
  name: string;
  value: number; // percentage
  color: string;
}

export const CATEGORY_SERIES: CategorySlice[] = [
  { name: "electronics", value: 35, color: "#6366f1" },
  { name: "fashion", value: 24, color: "#a855f7" },
  { name: "home", value: 18, color: "#38bdf8" },
  { name: "beauty", value: 12, color: "#f59e0b" },
  { name: "sports", value: 11, color: "#10b981" },
];

/* The activity feed now reads the live API — see components/dashboard/ActivityFeed. */
