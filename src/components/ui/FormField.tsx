import { forwardRef, useId, useState, type InputHTMLAttributes } from "react";
import { AlertCircle, Eye, EyeOff, type LucideIcon } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label: string;
  error?: string;
  icon?: LucideIcon;
  hint?: string;
}

/** Labelled input with icon, error and hint — used across auth + profile. */
export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, error, icon: Icon, hint, className, id, ...rest },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={inputId}
        className="block text-xs font-semibold text-slate-600 dark:text-slate-300"
      >
        {label}
      </label>

      <div className="relative">
        {Icon && (
          <Icon className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          className={cn(
            "w-full rounded-control border bg-slate-50/80 py-2.5 text-sm text-slate-800 outline-none transition-all",
            "placeholder:text-slate-400 focus:bg-white focus:ring-4",
            "dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-900",
            Icon ? "ps-10 pe-3.5" : "px-3.5",
            error
              ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10 dark:border-rose-500/60"
              : "border-slate-200 focus:border-brand-500/60 focus:ring-brand-500/10 dark:border-slate-700",
            className,
          )}
          {...rest}
        />
      </div>

      {error ? (
        <p className="flex items-center gap-1.5 text-xs font-medium text-rose-500">
          <AlertCircle className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-400 dark:text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

/** Password input with a show/hide toggle. */
export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(function PasswordField(
  { ...props },
  ref,
) {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <TextField ref={ref} {...props} type={visible ? "text" : "password"} className="pe-11" />
      <button
        type="button"
        aria-label={visible ? t("auth.hidePassword") : t("auth.showPassword")}
        onClick={() => setVisible((prev) => !prev)}
        className="absolute end-3 top-[1.95rem] grid size-6 place-items-center rounded text-slate-400 transition-colors hover:text-slate-600 dark:hover:text-slate-200"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});

/** Accessible toggle switch. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50",
        checked ? "bg-brand-600" : "bg-slate-300 dark:bg-slate-700",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-5 rounded-full bg-white shadow transition-all",
          checked ? "start-[1.375rem]" : "start-0.5",
        )}
      />
    </button>
  );
}
