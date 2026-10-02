import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { IconButton } from "@/components/ui/IconButton";

/** Animated light/dark switch — Sun means "switch to light", Moon vice versa. */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const isDark = theme === "dark";

  return (
    <IconButton label={isDark ? t("general.theme.toLight") : t("general.theme.toDark")} onClick={toggleTheme}>
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ y: -14, opacity: 0, rotate: -90, scale: 0.5 }}
          animate={{ y: 0, opacity: 1, rotate: 0, scale: 1 }}
          exit={{ y: 14, opacity: 0, rotate: 90, scale: 0.5 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="grid place-items-center"
        >
          {isDark ? <Sun className="size-5 text-amber-400" /> : <Moon className="size-5 text-indigo-500" />}
        </motion.span>
      </AnimatePresence>
    </IconButton>
  );
}
