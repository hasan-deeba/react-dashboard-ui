import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

type ToastVariant = "success" | "error" | "info";

interface ToastOptions {
  /** Optional second line under the title. */
  description?: string;
  /** Auto-dismiss delay in ms — default 4500; 0 keeps it until dismissed. */
  duration?: number;
}

interface ToastItem {
  id: number;
  variant: ToastVariant;
  title: string;
  description?: string;
  duration: number;
}

interface ToastContextValue {
  success: (title: string, options?: ToastOptions) => void;
  error: (title: string, options?: ToastOptions) => void;
  info: (title: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_META: Record<ToastVariant, { icon: LucideIcon; iconClass: string; bar: string }> = {
  success: { icon: CheckCircle2, iconClass: "text-emerald-500", bar: "bg-emerald-500" },
  error: { icon: XCircle, iconClass: "text-rose-500", bar: "bg-rose-500" },
  info: { icon: Info, iconClass: "text-brand-500", bar: "bg-brand-500" },
};

const DEFAULT_DURATION = 4500;
const MAX_VISIBLE = 4;

/**
 * Toast notifications for the whole app.
 *
 *   const toast = useToast();
 *   toast.success(t("resources.common.deleted"));
 *   toast.error(message, { description: "Try again in a moment" });
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { isRtl } = useLanguage();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef(new Map<number, number>());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    (variant: ToastVariant, title: string, options?: ToastOptions) => {
      nextId.current += 1;
      const item: ToastItem = {
        id: nextId.current,
        variant,
        title,
        description: options?.description,
        duration: options?.duration ?? DEFAULT_DURATION,
      };

      // Keep the stack bounded — drop the oldest when overflowing.
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), item]);

      if (item.duration > 0) {
        timers.current.set(
          item.id,
          window.setTimeout(() => dismiss(item.id), item.duration),
        );
      }
    },
    [dismiss],
  );

  // Never leave dangling timers behind.
  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const api = useMemo<ToastContextValue>(
    () => ({
      success: (title, options) => push("success", title, options),
      error: (title, options) => push("error", title, options),
      info: (title, options) => push("info", title, options),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Stack — anchored to the inline-end corner (flips in RTL) */}
      <div className="pointer-events-none fixed top-4 end-4 z-[100] flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const meta = VARIANT_META[item.variant];
            const Icon = meta.icon;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, x: isRtl ? -32 : 32, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: isRtl ? -32 : 32, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                className="pointer-events-auto relative overflow-hidden rounded-card border border-slate-200/70 bg-white/95 shadow-xl shadow-slate-900/10 backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/95 dark:shadow-black/40"
              >
                <div className="flex items-start gap-3 p-4 pe-10">
                  <Icon className={cn("mt-0.5 size-5 shrink-0", meta.iconClass)} />
                  <div className="min-w-0">
                    <p dir="auto" className="text-sm font-semibold text-slate-800 dark:text-white">
                      {item.title}
                    </p>
                    {item.description && (
                      <p
                        dir="auto"
                        className="mt-0.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400"
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  aria-label="Dismiss"
                  onClick={() => dismiss(item.id)}
                  className="absolute end-2 top-2 grid size-6 place-items-center rounded text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="size-3.5" />
                </button>

                {/* Countdown bar */}
                {item.duration > 0 && (
                  <motion.div
                    initial={{ scaleX: 1 }}
                    animate={{ scaleX: 0 }}
                    transition={{ duration: item.duration / 1000, ease: "linear" }}
                    className={cn(
                      "absolute bottom-0 h-0.5 w-full origin-left rtl:origin-right",
                      meta.bar,
                    )}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
