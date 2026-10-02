import { motion } from "framer-motion";
import { STATS } from "@/data/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export function StatsGrid() {
  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="show"
      aria-label="Key metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4"
    >
      {STATS.map((stat, index) => (
        <StatCard key={stat.id} stat={stat} index={index} />
      ))}
    </motion.section>
  );
}
