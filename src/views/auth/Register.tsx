import { useState, type FormEvent } from "react";
import { AlertCircle, Mail, User, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { PasswordField, TextField } from "@/components/ui/FormField";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/services/api";
import { Spinner } from "@/components/ui/Loading";
import { AuthLayout } from "@/views/auth/AuthLayout";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
}

const MIN_PASSWORD = 8;

export default function Register() {
  const { t } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!name.trim()) next.name = t("auth.validation.required");
    if (!email.trim()) next.email = t("auth.validation.required");
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = t("auth.validation.email");
    if (!password) next.password = t("auth.validation.required");
    else if (password.length < MIN_PASSWORD)
      next.password = t("auth.validation.min", { min: MIN_PASSWORD });
    if (confirm !== password) next.confirm = t("auth.validation.match");
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirmation: confirm,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error instanceof ApiError) {
        // Laravel 422 → { errors: { field: [msg] } }
        const data = error.data as { errors?: Record<string, string[]> } | undefined;
        if (data?.errors) {
          setErrors({
            name: data.errors.name?.[0],
            email: data.errors.email?.[0],
            password: data.errors.password?.[0],
          });
        } else {
          setFormError(error.message);
        }
      } else {
        setFormError(t("auth.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={t("auth.register.title")}
      subtitle={t("auth.register.subtitle")}
      footer={
        <>
          {t("auth.register.hasAccount")}{" "}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {t("auth.register.signIn")}
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
          label={t("auth.fields.name")}
          autoComplete="name"
          icon={User}
          placeholder={t("auth.fields.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />

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
          autoComplete="new-password"
          placeholder={t("auth.fields.passwordPlaceholder")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={t("auth.validation.min", { min: MIN_PASSWORD })}
        />

        <PasswordField
          label={t("auth.fields.passwordConfirm")}
          autoComplete="new-password"
          placeholder={t("auth.fields.passwordPlaceholder")}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
        />

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
              <UserPlus className="size-4" />
              {t("auth.register.submit")}
            </>
          )}
        </button>

        <p className="text-center text-[11px] leading-relaxed text-slate-400 dark:text-slate-500">
          {t("auth.register.terms")}
        </p>
      </form>
    </AuthLayout>
  );
}
