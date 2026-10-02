import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, LifeBuoy, LogOut, Shield, SlidersHorizontal, User, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { cn } from "@/utils/cn";

const MENU_ITEMS: Array<{ path: string; icon: LucideIcon; labelKey: string }> = [
  { path: "/profile", icon: User, labelKey: "header.userMenu.profile" },
  { path: "/appearance", icon: SlidersHorizontal, labelKey: "header.userMenu.preferences" },
  { path: "/help", icon: LifeBuoy, labelKey: "header.userMenu.help" },
];

export function UserMenu() {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const containerRef = useClickOutside<HTMLDivElement>(close);

  const name = user?.name ?? "";
  const role = user?.roles?.[0] ?? "";

  const go = (path: string) => {
    navigate(path);
    close();
  };

  const handleSignOut = async () => {
    close();
    await logout();
    navigate("/login");
  };

  const avatar = (size: string) =>
    user?.image ? (
      <img src={user.image} alt={name} className={cn(size, "rounded-full object-cover ring-2 ring-brand-500/50")} />
    ) : (
      <InitialsAvatar name={name} className={cn(size, "text-xs ring-2 ring-brand-500/40")} />
    );

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2.5 rounded-control py-1 pe-2 ps-1 transition-colors hover:bg-slate-200/50 dark:hover:bg-slate-800/70"
      >
        {avatar("size-9")}
        <span className="hidden text-start xl:block">
          <span className="block text-sm font-semibold leading-tight text-slate-800 dark:text-white">
            {name}
          </span>
          <span className="block text-xs capitalize leading-tight text-slate-500 dark:text-slate-400">
            {role}
          </span>
        </span>
        <ChevronDown
          className={cn("size-4 text-slate-400 transition-transform duration-300", open && "rotate-180")}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="absolute end-0 top-full z-50 mt-3 w-60 origin-top overflow-hidden rounded-card border border-slate-200/70 bg-white/95 shadow-2xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/40"
          >
            <div className="flex items-center gap-3 border-b border-slate-200/70 p-4 dark:border-slate-700/60">
              {avatar("size-10")}
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">{name}</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
              </div>
            </div>

            {user?.roles?.length ? (
              <div className="flex flex-wrap gap-1.5 border-b border-slate-200/70 px-4 py-2.5 dark:border-slate-700/60">
                {user.roles.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400"
                  >
                    <Shield className="size-2.5" />
                    {item}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="p-1.5">
              {MENU_ITEMS.map(({ path, icon: Icon, labelKey }) => (
                <button
                  key={labelKey}
                  type="button"
                  onClick={() => go(path)}
                  className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-start text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/70 dark:hover:text-white"
                >
                  <Icon className="size-4 shrink-0 text-slate-400" />
                  {t(labelKey)}
                </button>
              ))}

              <div className="my-1 h-px bg-slate-200/70 dark:bg-slate-700/60" />

              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-3 rounded-control px-3 py-2 text-start text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
              >
                <LogOut className="size-4 shrink-0 rtl:-scale-x-100" />
                {t("header.userMenu.signOut")}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
