/**
 * Page controller for /settings.
 *
 * PURPOSE : owns the whole lifecycle — parallel load of values + builder,
 *           drafts, dirty tracking, per-section save, confirmations — so the
 *           page component stays declarative. Save rules implemented here:
 *             - JSON POST for scalars/booleans/translations/removals;
 *             - one multipart POST per staged image (never the stored URL);
 *             - the POST response carries no data, so afterwards we refetch
 *               `GET settings` and rebuild only the saved group's drafts;
 *             - on failure the user's input is kept, 422 errors map onto the
 *               dot-path keys, and values are silently resynced (a preceding
 *               request of the same save may already have applied).
 * EXPORTS : useSettingsForm() → SettingsFormController.
 * EDIT    : 401 handling is NOT here — the api client emits
 *           AUTH_UNAUTHORIZED_EVENT and AuthContext redirects to /login.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { ApiError } from "@/services/api";
import {
  fetchSettings,
  fetchSettingsBuilder,
  saveSettings,
  uploadSettingImage,
} from "@/services/settings";
import type {
  SettingsBuilderResponse,
  SettingsFieldMeta,
  SettingsGroupMeta,
  SettingsValues,
} from "@/types/settings";
import {
  anyDirty,
  buildDrafts,
  buildGroupPatch,
  fieldDomId,
  groupIsDirty,
  initialFieldDraft,
  type Drafts,
  type FieldDraft,
  type LangCode,
} from "@/views/settings/settingsState";
import { lockPrerequisites, validateGroup, type FieldIssue } from "@/views/settings/validation";

export interface LoadError {
  status: number;
  message: string;
}

/** A switch the user tried to enable that needs a confirmation dialog first. */
export interface PendingToggle {
  kind: "maintenance" | "lock";
  field: SettingsFieldMeta;
}

export interface SettingsFormController {
  loading: boolean;
  loadError: LoadError | null;
  retry: () => void;
  builder: SettingsBuilderResponse | null;
  values: SettingsValues | null;
  drafts: Drafts;
  errors: Record<string, string>;
  /** Dot path of the group currently saving, null when idle. */
  savingGroup: string | null;
  dirty: boolean;
  groupDirty: (group: SettingsGroupMeta) => boolean;
  setScalar: (key: string, value: string) => void;
  setTranslated: (key: string, lang: LangCode, value: string) => void;
  requestToggle: (field: SettingsFieldMeta, next: boolean) => void;
  pendingToggle: PendingToggle | null;
  confirmPendingToggle: () => void;
  cancelPendingToggle: () => void;
  stageImage: (field: SettingsFieldMeta, file: File) => void;
  removeImage: (field: SettingsFieldMeta) => void;
  undoImage: (field: SettingsFieldMeta) => void;
  setImageError: (key: string, message: string | null) => void;
  saveGroup: (group: SettingsGroupMeta) => Promise<void>;
}

export function useSettingsForm(): SettingsFormController {
  const { t } = useLanguage();
  const toast = useToast();

  const [builder, setBuilder] = useState<SettingsBuilderResponse | null>(null);
  const [values, setValues] = useState<SettingsValues | null>(null);
  const [drafts, setDrafts] = useState<Drafts>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadError | null>(null);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [pendingToggle, setPendingToggle] = useState<PendingToggle | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  /**
   * Load values + builder in parallel. `t` changes identity with the UI
   * language, so switching languages refetches the builder (its labels are
   * translated by the server from the Accept-Language header).
   */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    Promise.all([fetchSettings(), fetchSettingsBuilder()])
      .then(([freshValues, freshBuilder]) => {
        if (cancelled) return;
        setValues(freshValues);
        setBuilder(freshBuilder);
        setErrors({});
        setDrafts(buildDrafts(freshBuilder.groups, freshValues));
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const status = error instanceof ApiError ? error.status : 0;
        const serverMessage =
          error instanceof ApiError && error.message ? error.message : "";
        setLoadError({ status, message: serverMessage || t("settings.status.loadError") });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t, reloadToken]);

  const retry = useCallback(() => setReloadToken((n) => n + 1), []);

  const groups = useMemo(() => builder?.groups ?? [], [builder]);

  const dirty = useMemo(
    () => (values ? anyDirty(groups, drafts, values) : false),
    [groups, drafts, values],
  );

  const groupDirty = useCallback(
    (group: SettingsGroupMeta) => (values ? groupIsDirty(group, drafts, values) : false),
    [drafts, values],
  );

  /* ------------------------------ error state ------------------------------ */

  /** Clear a field's errors — the base key and any sub-language keys. */
  const clearError = useCallback((key: string) => {
    setErrors((prev) => {
      const affected = Object.keys(prev).filter((k) => k === key || k.startsWith(`${key}.`));
      if (affected.length === 0) return prev;
      const next = { ...prev };
      for (const affectedKey of affected) delete next[affectedKey];
      return next;
    });
  }, []);

  const setImageError = useCallback((key: string, message: string | null) => {
    setErrors((prev) => {
      const next = { ...prev };
      if (message) next[key] = message;
      else delete next[key];
      return next;
    });
  }, []);

  /** Focus the input behind a validation issue (scrolls it into view too). */
  const focusIssue = useCallback((issue: FieldIssue) => {
    const target =
      document.getElementById(fieldDomId(issue.key, issue.sub)) ??
      document.getElementById(fieldDomId(issue.key));
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, []);

  /* ------------------------------ mutations ------------------------------- */

  const setScalar = useCallback(
    (key: string, value: string) => {
      setDrafts((prev) => ({ ...prev, [key]: { kind: "scalar", value } }));
      clearError(key);
    },
    [clearError],
  );

  const setTranslated = useCallback(
    (key: string, lang: LangCode, value: string) => {
      setDrafts((prev) => {
        const current = prev[key];
        if (current?.kind !== "translated") return prev;
        return { ...prev, [key]: { ...current, [lang]: value } };
      });
      clearError(key);
    },
    [clearError],
  );

  const applyBoolean = useCallback(
    (key: string, next: boolean) => {
      setDrafts((prev) => ({ ...prev, [key]: { kind: "boolean", value: next } }));
      clearError(key);
    },
    [clearError],
  );

  /**
   * Switch clicks pass through here: turning OFF is always applied directly;
   * enabling maintenance or an update lock needs a confirmation; enabling a
   * lock additionally requires version + store URL (draft view), failing
   * which the toggle is blocked and the errors land on those inputs.
   */
  const requestToggle = useCallback(
    (field: SettingsFieldMeta, next: boolean) => {
      if (!next) {
        applyBoolean(field.key, false);
        return;
      }

      if (field.key.endsWith(".lock_for_update")) {
        const group = groups.find((g) => g.fields.some((f) => f.key === field.key));
        if (group) {
          // Evaluate the lock as if enabled, against saved + edited values.
          const hypothetical: Drafts = {
            ...drafts,
            [field.key]: { kind: "boolean", value: true } as FieldDraft,
          };
          const { missing } = lockPrerequisites(field.key, group, hypothetical);
          if (missing.length > 0) {
            const messageFor = (key: string): string =>
              key.endsWith(".version")
                ? t("settings.validation.lockNeedsVersion")
                : t("settings.validation.lockNeedsStore");
            setErrors((prev) => {
              const merged = { ...prev };
              for (const key of missing) merged[key] = messageFor(key);
              return merged;
            });
            toast.info(t("settings.validation.lockBlocked"));
            focusIssue({ key: missing[0], message: messageFor(missing[0]) });
            return;
          }
        }
        setPendingToggle({ kind: "lock", field });
        return;
      }

      if (field.key.endsWith("maintenance_enabled")) {
        setPendingToggle({ kind: "maintenance", field });
        return;
      }

      applyBoolean(field.key, true);
    },
    [applyBoolean, drafts, focusIssue, groups, t, toast],
  );

  const confirmPendingToggle = useCallback(() => {
    if (pendingToggle) applyBoolean(pendingToggle.field.key, true);
    setPendingToggle(null);
  }, [applyBoolean, pendingToggle]);

  const cancelPendingToggle = useCallback(() => setPendingToggle(null), []);

  /* -------------------------------- images -------------------------------- */

  const stageImage = useCallback(
    (field: SettingsFieldMeta, file: File) => {
      setDrafts((prev) => ({
        ...prev,
        [field.key]: { kind: "image", stage: { status: "staged", file } },
      }));
      clearError(field.key);
    },
    [clearError],
  );

  const removeImage = useCallback(
    (field: SettingsFieldMeta) => {
      // Clearing is a JSON `null` — no file involved.
      setDrafts((prev) => ({
        ...prev,
        [field.key]: { kind: "image", stage: { status: "removed" } },
      }));
      clearError(field.key);
    },
    [clearError],
  );

  const undoImage = useCallback((field: SettingsFieldMeta) => {
    setDrafts((prev) => ({
      ...prev,
      [field.key]: { kind: "image", stage: { status: "unchanged" } },
    }));
  }, []);

  /* --------------------------------- save --------------------------------- */

  const saveGroup = useCallback(
    async (group: SettingsGroupMeta) => {
      if (!values || savingGroup) return;

      const issues = validateGroup(group, drafts, t);
      if (issues.length > 0) {
        setErrors((prev) => {
          const merged = { ...prev };
          for (const issue of issues) {
            merged[issue.sub ? `${issue.key}.${issue.sub}` : issue.key] = issue.message;
          }
          return merged;
        });
        focusIssue(issues[0]);
        return;
      }

      const { patch, uploads } = buildGroupPatch(group, drafts, values);
      // Guard rail: an empty body would be rejected with errors.settings.
      if (Object.keys(patch).length === 0 && uploads.length === 0) return;

      setSavingGroup(group.key);
      try {
        // JSON first: a 422 here means no image was uploaded yet, so the
        // user fixes the input and retries without orphaned replacements.
        let message: string | undefined;
        if (Object.keys(patch).length > 0) {
          message = (await saveSettings(patch)).message;
        }
        for (const upload of uploads) {
          const response = await uploadSettingImage(upload.key, upload.file);
          message = response.message || message;
        }

        toast.success(message || t("form.updated"));

        // The POST returns no data — refetch for canonical values (image
        // URLs are only known to the server), then reset JUST this group so
        // other sections keep their pending edits.
        const fresh = await fetchSettings();
        setValues(fresh);
        setDrafts((prev) => {
          const next = { ...prev };
          for (const field of group.fields) next[field.key] = initialFieldDraft(field, fresh);
          return next;
        });
        for (const field of group.fields) clearError(field.key);
      } catch (error) {
        if (error instanceof ApiError && error.status === 422) {
          const data = error.data as { errors?: Record<string, string[]> } | undefined;
          const serverErrors = Object.entries(data?.errors ?? {})
            .filter((pair): pair is [string, string[]] => Array.isArray(pair[1]) && pair[1].length > 0)
            .map(([key, messages]): FieldIssue => {
              // Sub-language keys ("…app_name.en") focus the right sub-input.
              const field = group.fields.find(
                (f) => key === f.key || key.startsWith(`${f.key}.`),
              );
              const sub =
                field && key !== field.key
                  ? (key.slice(field.key.length + 1) as FieldIssue["sub"])
                  : undefined;
              return { key: field?.key ?? key, sub, message: messages[0] };
            });

          if (serverErrors.length === 0) {
            toast.error(error.message || t("form.errors.generic"));
          } else {
            setErrors((prev) => {
              const merged = { ...prev };
              for (const issue of serverErrors) {
                merged[issue.sub ? `${issue.key}.${issue.sub}` : issue.key] = issue.message;
              }
              return merged;
            });
            focusIssue(serverErrors[0]);
          }
        } else {
          const message =
            error instanceof ApiError && error.message ? error.message : t("form.errors.generic");
          toast.error(message);
        }

        // A request may have succeeded before the failing one — pull the
        // canonical values so dirty badges and retries reflect reality.
        fetchSettings()
          .then(setValues)
          .catch(() => undefined);
      } finally {
        setSavingGroup(null);
      }
    },
    [clearError, drafts, focusIssue, savingGroup, t, toast, values],
  );

  return {
    loading,
    loadError,
    retry,
    builder,
    values,
    drafts,
    errors,
    savingGroup,
    dirty,
    groupDirty,
    setScalar,
    setTranslated,
    requestToggle,
    pendingToggle,
    confirmPendingToggle,
    cancelPendingToggle,
    stageImage,
    removeImage,
    undoImage,
    setImageError,
    saveGroup,
  };
}
