import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { Spinner } from "@/components/ui/Loading";
import { cn } from "@/utils/cn";

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: string;
  /** Rich content rendered under the description (tables, diffs, forms…). */
  body?: ReactNode;
  /** Hide the cancel button — use for read-only/acknowledge dialogs. */
  hideCancel?: boolean;
  /** Wider dialog for content-heavy bodies. */
  size?: "sm" | "lg";
  /** Label of the destructive action (defaults to "Delete"). */
  confirmLabel?: string;
  cancelLabel?: string;
  /** Semantic tone for the confirm button. */
  tone?: "danger" | "primary";
  /** Shows a spinner and blocks interaction while the action runs. */
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Accessible confirmation dialog — used for destructive actions
 * (record deletion, bulk operations…).
 */
export function ConfirmModal({
  open,
  title,
  description,
  body,
  hideCancel = false,
  size = "sm",
  confirmLabel,
  cancelLabel,
  tone = "danger",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const { t } = useLanguage();

  // Escape closes (unless an action is in flight).
  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, loading, onCancel]);

  const confirm = confirmLabel ?? t("form.modal.confirm");
  const cancel = cancelLabel ?? t("form.modal.cancel");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!loading) onCancel();
          }}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-label={title}
            className={cn(
              "surface-card relative w-full p-6",
              size === "lg" ? "max-w-2xl" : "max-w-sm",
            )}
          >
            <button
              type="button"
              aria-label={cancel}
              onClick={() => {
                if (!loading) onCancel();
              }}
              className="absolute end-3 top-3 grid size-7 place-items-center rounded-control text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              <X className="size-4" />
            </button>

            <span
              className={cn(
                "grid size-12 place-items-center rounded-icon",
                tone === "danger"
                  ? "bg-rose-500/10 text-rose-500"
                  : "bg-brand-500/10 text-brand-600 dark:text-brand-400",
              )}
            >
              <AlertTriangle className="size-6" />
            </span>

            <h2
              dir="auto"
              className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white"
            >
              {title}
            </h2>
            {description && (
              <p
                dir="auto"
                className="mt-1.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400"
              >
                {description}
              </p>
            )}

            {body && <div className="mt-5 max-h-[60vh] overflow-y-auto">{body}</div>}

            <div className="mt-6 flex items-center justify-end gap-2.5">
              {!hideCancel && (
                <button
                  type="button"
                  onClick={() => {
                    if (!loading) onCancel();
                  }}
                  disabled={loading}
                  className="rounded-control border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {cancel}
                </button>
              )}
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                autoFocus
                className={cn(
                  "flex items-center gap-2 rounded-control px-4 py-2 text-xs font-bold text-white transition-transform",
                  "disabled:pointer-events-none disabled:opacity-60",
                  tone === "danger"
                    ? "bg-rose-600 shadow-lg shadow-rose-600/25 hover:scale-[1.03]"
                    : "bg-gradient-to-r from-brand-600 to-accent-600 shadow-lg shadow-brand-600/25 hover:scale-[1.03]",
                )}
              >
                {loading && <Spinner size="xs" onBrand />}
                {confirm}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
