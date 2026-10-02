import { useState, type FormEvent } from "react";
import { AlertCircle, LogIn, Mail } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { PasswordField, Switch, TextField } from "@/components/ui/FormField";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/services/api";
import { Spinner } from "@/components/ui/Loading";
import { AuthLayout } from "@/views/auth/AuthLayout";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function Login() {
  const { t } = useLanguage();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!email.trim()) next.email = t("auth.validation.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("auth.validation.email");
    if (!password) next.password = t("auth.validation.required");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim(), password }, remember);
      const target = (location.state as { from?: string } | null)?.from ?? "/dashboard";
      navigate(target, { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.status === 401 ? t("auth.errors.invalid") : error.message);
      } else {
        setFormError(t("auth.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.login.title")}
      subtitle={t("auth.login.subtitle")}
      footer={
        <>
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/register"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {t("auth.login.signUp")}
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <div className="flex items-start gap-2 rounded-control bg-rose-500/10 px-3 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span dir="auto">{formError}</span>
          </div>
        )}

        <TextField
          label={t("auth.fields.email")}
          type="email"
          autoComplete="email"
          icon={Mail}
          placeholder={t("auth.fields.emailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />

        <PasswordField
          label={t("auth.fields.password")}
          autoComplete="current-password"
          placeholder={t("auth.fields.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
        />

        <div className="flex items-center justify-between pt-1">
          <label className="flex cursor-pointer items-center gap-2.5">
            <Switch checked={remember} onChange={setRemember} label={t("auth.login.remember")} />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
              {t("auth.login.remember")}
            </span>
          </label>
          <button
            type="button"
            className="text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {t("auth.login.forgot")}
          </button>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.02] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Spinner size="xs" onBrand />
              {t("auth.loading")}
            </>
          ) : (
            <>
              <LogIn className="size-4 rtl:-scale-x-100" />
              {t("auth.login.submit")}
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
