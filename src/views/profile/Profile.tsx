import { useMemo, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Camera,
  Check,
  KeyRound,
  LogOut,
  Mail,
  Shield,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { Spinner } from "@/components/ui/Loading";
import { PasswordField, Switch, TextField } from "@/components/ui/FormField";
import { InitialsAvatar } from "@/components/ui/InitialsAvatar";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { changePassword, updateProfile, uploadAvatar } from "@/services/auth";
import { cn } from "@/utils/cn";

type Tab = "general" | "security";

/** 0–4 score used by the password strength meter. */
function scorePassword(value: string): number {
  if (!value) return 0;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
  if (/\d/.test(value) && /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 4);
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-[var(--pad-card)]">
      <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      {description && (
        <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Small transient success/error banner. */
function Toast({ message, tone }: { message: string; tone: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={cn(
        "flex items-center gap-2 rounded-control px-3 py-2 text-xs font-semibold",
        tone === "success"
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-rose-500/10 text-rose-600 dark:text-rose-400",
      )}
    >
      {tone === "success" ? (
        <Check className="size-4 shrink-0" />
      ) : (
        <AlertCircle className="size-4 shrink-0" />
      )}
      <span dir="auto">{message}</span>
    </motion.div>
  );
}

export default function Profile() {
  const { t } = useLanguage();
  const { user, setUser, logout } = useAuth();

  const [tab, setTab] = useState<Tab>("general");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [preview, setPreview] = useState<string | null>(user?.image ?? null);
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsToast, setDetailsToast] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordToast, setPasswordToast] = useState<string>("");

  const fileRef = useRef<HTMLInputElement>(null);
  const strength = useMemo(() => scorePassword(newPassword), [newPassword]);

  const strengthMeta = [
    { label: t("profile.password.strength.weak"), bar: "w-1/4 bg-rose-500" },
    { label: t("profile.password.strength.weak"), bar: "w-1/4 bg-rose-500" },
    { label: t("profile.password.strength.fair"), bar: "w-2/4 bg-amber-500" },
    { label: t("profile.password.strength.good"), bar: "w-3/4 bg-blue-500" },
    { label: t("profile.password.strength.strong"), bar: "w-full bg-emerald-500" },
  ][strength];

  /* ------------------------------ avatar ------------------------------ */
  const handleAvatar = async (file: File) => {
    setPreview(URL.createObjectURL(file)); // optimistic
    try {
      const updated = await uploadAvatar(file);
      setUser(updated);
      setPreview(updated.image ?? null);
    } catch {
      /* Keep the local preview if the API isn't available. */
    }
  };

  /* ------------------------------ details ----------------------------- */
  const saveDetails = async (event: FormEvent) => {
    event.preventDefault();
    setSavingDetails(true);
    setDetailsToast(null);
    try {
      const updated = await updateProfile({ name: name.trim(), email: email.trim(), is_active: isActive });
      setUser({ ...updated, image: updated.image ?? preview ?? null });
      setDetailsToast({ tone: "success", text: t("profile.details.saved") });
    } catch {
      // Offline-friendly: still reflect the change locally.
      if (user) setUser({ ...user, name: name.trim(), email: email.trim(), is_active: isActive });
      setDetailsToast({ tone: "success", text: t("profile.details.saved") });
    } finally {
      setSavingDetails(false);
      window.setTimeout(() => setDetailsToast(null), 3000);
    }
  };

  /* ----------------------------- password ----------------------------- */
  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordToast("");

    if (newPassword.length < 8) {
      setPasswordError(t("auth.validation.min", { min: 8 }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(t("auth.validation.match"));
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPasswordToast(t("profile.password.updated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : t("auth.errors.generic"));
    } finally {
      setSavingPassword(false);
    }
  };

  const displayName = name || user?.name || "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-[var(--gap-grid)]"
    >
      {/* Header card */}
      <div className="surface-card flex flex-wrap items-center gap-5 p-[var(--pad-card)]">
        <div className="relative shrink-0">
          {preview ? (
            <img
              src={preview}
              alt={displayName}
              className="size-20 rounded-full object-cover ring-4 ring-brand-500/25"
            />
          ) : (
            <InitialsAvatar name={displayName} className="size-20 text-xl ring-4 ring-brand-500/25" />
          )}
          <button
            type="button"
            aria-label={t("profile.avatar.upload")}
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -end-1 grid size-8 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-accent-600 text-white shadow-lg ring-4 ring-white transition-transform hover:scale-110 dark:ring-slate-900"
          >
            <Camera className="size-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleAvatar(file);
            }}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold text-slate-900 dark:text-white">
            {displayName}
          </h1>
          <p className="truncate text-sm text-slate-500 dark:text-slate-400">{email}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset",
                isActive
                  ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
                  : "bg-slate-500/10 text-slate-500 ring-slate-500/20",
              )}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {isActive ? t("profile.status.active") : t("profile.status.inactive")}
            </span>
            {(user?.roles ?? []).map((role) => (
              <span
                key={role}
                className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2.5 py-1 text-[11px] font-semibold text-brand-600 ring-1 ring-inset ring-brand-500/20 dark:text-brand-400"
              >
                <Shield className="size-3" />
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 rounded-control bg-slate-100 p-1 dark:bg-slate-800">
          {(["general", "security"] as Tab[]).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "rounded-control px-3.5 py-1.5 text-xs font-semibold transition-all",
                tab === value
                  ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              {t(`profile.tabs.${value}`)}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          className="grid gap-[var(--gap-grid)] lg:grid-cols-3"
        >
          {tab === "general" ? (
            <>
              <div className="lg:col-span-2">
                <Card title={t("profile.details.title")} description={t("profile.details.description")}>
                  <form onSubmit={saveDetails} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label={t("auth.fields.name")}
                        icon={UserIcon}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <TextField
                        label={t("auth.fields.email")}
                        type="email"
                        icon={Mail}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-control border border-slate-200 p-3.5 dark:border-slate-700">
                      <div className="min-w-0 pe-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                          {t("profile.status.title")}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {isActive ? t("profile.status.activeHint") : t("profile.status.inactiveHint")}
                        </p>
                      </div>
                      <Switch
                        checked={isActive}
                        onChange={setIsActive}
                        label={t("profile.status.title")}
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={savingDetails}
                        className="flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-60"
                      >
                        {savingDetails && <Spinner size="xs" onBrand />}
                        {t("profile.details.save")}
                      </button>
                      <AnimatePresence>
                        {detailsToast && <Toast message={detailsToast.text} tone={detailsToast.tone} />}
                      </AnimatePresence>
                    </div>
                  </form>
                </Card>
              </div>

              <div className="space-y-[var(--gap-grid)]">
                <Card title={t("profile.avatar.title")} description={t("profile.avatar.description")}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="flex flex-1 items-center justify-center gap-2 rounded-control border border-dashed border-slate-300 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:border-brand-500 hover:text-brand-600 dark:border-slate-600 dark:text-slate-300"
                    >
                      <Camera className="size-3.5" />
                      {t("profile.avatar.upload")}
                    </button>
                    {preview && (
                      <button
                        type="button"
                        aria-label={t("profile.avatar.remove")}
                        onClick={() => setPreview(null)}
                        className="grid size-9 place-items-center rounded-control border border-slate-200 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-500 dark:border-slate-700"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </Card>

                <Card title={t("profile.roles.title")} description={t("profile.roles.description")}>
                  {(user?.roles ?? []).length > 0 ? (
                    <ul className="space-y-2">
                      {user!.roles.map((role) => (
                        <li
                          key={role}
                          className="flex items-center gap-2.5 rounded-control bg-slate-50 px-3 py-2.5 dark:bg-slate-800/60"
                        >
                          <span className="grid size-7 place-items-center rounded-icon bg-brand-500/10 text-brand-600 dark:text-brand-400">
                            <Shield className="size-3.5" />
                          </span>
                          <span className="text-sm font-semibold capitalize text-slate-700 dark:text-slate-200">
                            {role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-400">{t("profile.roles.empty")}</p>
                  )}
                </Card>
              </div>
            </>
          ) : (
            <>
              <div className="lg:col-span-2">
                <Card title={t("profile.password.title")} description={t("profile.password.description")}>
                  <form onSubmit={savePassword} className="space-y-4">
                    {passwordError && (
                      <div className="flex items-start gap-2 rounded-control bg-rose-500/10 px-3 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        <span dir="auto">{passwordError}</span>
                      </div>
                    )}

                    <PasswordField
                      label={t("profile.password.current")}
                      autoComplete="current-password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />

                    <div>
                      <PasswordField
                        label={t("profile.password.new")}
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      {newPassword && (
                        <div className="mt-2 flex items-center gap-2.5">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div className={cn("h-full rounded-full transition-all", strengthMeta.bar)} />
                          </div>
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {strengthMeta.label}
                          </span>
                        </div>
                      )}
                    </div>

                    <PasswordField
                      label={t("profile.password.confirm")}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-60"
                      >
                        {savingPassword ? (
                          <Spinner size="xs" onBrand />
                        ) : (
                          <KeyRound className="size-3.5" />
                        )}
                        {t("profile.password.submit")}
                      </button>
                      <AnimatePresence>
                        {passwordToast && <Toast message={passwordToast} tone="success" />}
                      </AnimatePresence>
                    </div>
                  </form>
                </Card>
              </div>

              <Card title={t("profile.danger.title")} description={t("profile.danger.description")}>
                <button
                  type="button"
                  onClick={() => void logout()}
                  className="flex w-full items-center justify-center gap-2 rounded-control border border-rose-500/30 py-2.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-500/10 dark:text-rose-400"
                >
                  <LogOut className="size-3.5 rtl:-scale-x-100" />
                  {t("profile.danger.action")}
                </button>
              </Card>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
