import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowLeft, Check, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/components/ui/Toast";
import { LoadingPanel, Spinner } from "@/components/ui/Loading";
import { ApiError } from "@/services/api";
import {
  createResource,
  fetchSingleton,
  getBuilderRaw,
  saveSingleton,
  showResource,
  toOptions,
  updateResource,
} from "@/services/resources";
import { cn } from "@/utils/cn";
import { normalizeFields, type FieldInput } from "@/components/form/fields";
import { FormFieldRenderer } from "@/components/form/FormFieldRenderer";
import { normalizeGroups } from "@/components/form/inputs/GroupedCheckbox";
import { validateAll, validateField } from "@/components/form/validate";
import type { FieldDef, FormValues, SelectOption } from "@/components/form/types";

export interface DynamicFormProps {
  /** Laravel resource path — POST `{resource}`, PUT `{resource}/{id}`. */
  resource: string;
  fields: FieldInput[];
  /** Present ⇒ edit mode: the record is fetched and PUT on submit. */
  recordId?: string | number;
  /**
   * Singleton resource — no id. Loads `GET {resource}` and submits
   * `POST {resource}` (settings, site config…).
   */
  singleton?: boolean;
  /** Override the endpoint if it differs from `resource`. */
  endpoint?: string;
  titleKey?: string;
  title?: string;
  descriptionKey?: string;
  description?: string;
  submitLabelKey?: string;
  /** Where to go after a successful save. */
  redirectTo?: string;
  onSuccess?: (record: unknown) => void;
  /** Seed values (create mode). */
  initialValues?: FormValues;
  /** Map form values → request payload (defaults to identity). */
  transform?: (values: FormValues) => Record<string, unknown>;
}

/** Fields default to half width on large screens. */
function widthClass(field: FieldDef): string {
  if (
    field.type === "textarea" ||
    field.type === "image" ||
    field.type === "switch" ||
    field.type === "grouped-checkbox"
  ) {
    return "sm:col-span-2";
  }
  return field.width === "full" ? "sm:col-span-2" : "sm:col-span-1";
}

/**
 * Declarative create/edit form.
 *
 *   <DynamicForm resource="users" fields={userFields} recordId={id} />
 *
 * Handles: record loading, `{resource}/builder` options, validation,
 * create vs update, Laravel 422 errors and multipart when files are present.
 */
export function DynamicForm({
  resource,
  fields,
  recordId,
  singleton = false,
  endpoint,
  titleKey,
  title,
  descriptionKey,
  description,
  submitLabelKey,
  redirectTo,
  onSuccess,
  initialValues,
  transform,
}: DynamicFormProps) {
  const { t } = useLanguage();
  const toast = useToast();
  const navigate = useNavigate();

  const isEdit = !singleton && recordId !== undefined && recordId !== null && recordId !== "";
  const path = endpoint ?? resource;
  const defs = useMemo(() => normalizeFields(fields), [fields]);

  /** Fields relevant to the current mode. */
  const activeFields = useMemo(
    () => defs.filter((f) => !f.only || (f.only === "edit") === isEdit),
    [defs, isEdit],
  );

  /** Field types whose value is an array of option values (ids). */
  const isArrayField = (type: FieldDef["type"]): boolean =>
    type === "multiselect" || type === "grouped-checkbox";

  const buildDefaults = useCallback((): FormValues => {
    const values: FormValues = {};
    for (const f of defs) {
      values[f.name] =
        f.defaultValue ?? (isArrayField(f.type) ? [] : f.type === "switch" ? false : "");
    }
    return { ...values, ...initialValues };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defs]);

  const [values, setValues] = useState<FormValues>(buildDefaults);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  /** Raw builder items per key — normalised per field via `optionKeys`. */
  const [builderOptions, setBuilderOptions] = useState<Record<string, unknown[]>>({});
  const [loading, setLoading] = useState(isEdit || singleton);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);

  /* ----------------------- builder options (global) ---------------------- */
  // Only resources whose fields need options have a /builder route.
  useEffect(() => {
    if (!defs.some((f) => f.builderKey && !f.options?.length)) return;
    let cancelled = false;
    getBuilderRaw(resource)
      .then((options) => {
        if (!cancelled) setBuilderOptions(options);
      })
      .catch(() => {
        /* Builder is optional — static options still work. */
      });
    return () => {
      cancelled = true;
    };
  }, [resource, defs]);

  /* --------------------------- load the record --------------------------- */
  useEffect(() => {
    if (!isEdit && !singleton) return;
    let cancelled = false;
    setLoading(true);

    // Singletons have no id: the resource itself is the record.
    const load = singleton
      ? fetchSingleton<Record<string, unknown>>(path)
      : showResource<Record<string, unknown>>(path, recordId!);

    load
      .then((record) => {
        if (cancelled || !record) return;
        setValues((prev) => {
          const next: FormValues = { ...prev };
          for (const f of defs) {
            const raw = record[f.name];
            if (raw === undefined) continue;
            if (isArrayField(f.type)) {
              /**
               * Arrays may arrive as ids (["1"]), names (["users.create"])
               * or full objects ([{ id, name }]) — always store the option
               * VALUE (id by default) so the control matches and the form
               * submits ids, in create *and* edit alike.
               */
              next[f.name] = Array.isArray(raw)
                ? raw
                    .map((item) => resolveItemValue(f, item))
                    .filter((v): v is string => Boolean(v))
                : [];
            } else if (f.type === "select") {
              next[f.name] = resolveItemValue(f, raw) ?? "";
            } else if (f.type === "switch") {
              next[f.name] = Boolean(raw);
            } else if (f.type === "password") {
              next[f.name] = "";
            } else {
              next[f.name] = raw as FormValues[string];
            }
          }
          return next;
        });
      })
      .catch(() => {
        /* Keep defaults if the record can't be fetched. */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isEdit, singleton, path, recordId, defs]);

  /* ------------------------------- helpers ------------------------------- */
  const optionsFor = (fieldDef: FieldDef): SelectOption[] => {
    if (fieldDef.options && fieldDef.options.length > 0) return fieldDef.options;
    return toOptions(
      builderOptions[fieldDef.builderKey ?? fieldDef.name] ?? [],
      fieldDef.optionKeys,
    );
  };

  /**
   * All selectable options for a field as a flat list —
   * grouped-checkbox fields inspect every group's items.
   */
  const optionItemsFor = (fieldDef: FieldDef): SelectOption[] => {
    if (fieldDef.type === "grouped-checkbox") {
      return normalizeGroups(
        builderOptions[fieldDef.builderKey ?? fieldDef.name] ?? [],
        fieldDef.optionKeys,
      ).flatMap((group) => group.items);
    }
    return optionsFor(fieldDef);
  };

  /**
   * Resolve ANY incoming selection item to the option VALUE it represents:
   *   - objects  → their configured value key (default: value ?? id ?? key ?? name)
   *   - strings that match an option's LABEL (e.g. "users.create")
   *              → that option's value (e.g. "1")
   * Unknown values pass through unchanged.
   */
  const resolveItemValue = (fieldDef: FieldDef, item: unknown): string | undefined => {
    if (item === null || item === undefined) return undefined;

    if (typeof item === "object") {
      const obj = item as Record<string, unknown>;
      const key = fieldDef.optionKeys?.value;
      const picked =
        key && obj[key] !== undefined ? obj[key] : (obj.value ?? obj.id ?? obj.key ?? obj.name);
      return picked !== undefined && picked !== null ? String(picked) : undefined;
    }

    const str = String(item);
    const options = optionItemsFor(fieldDef);
    const match = options.find((o) => o.value === str) ?? options.find((o) => o.label === str);
    return match ? match.value : str;
  };

  const setValue = (name: string, value: FormValues[string]) => {
    setValues((prev) => {
      const next = { ...prev, [name]: value };
      // Re-validate a touched field as the user types.
      if (touched[name]) {
        const def = defs.find((f) => f.name === name);
        if (def) {
          const error = validateField(def, next, t);
          setErrors((prevErrors) => {
            const copy = { ...prevErrors };
            if (error) copy[name] = error;
            else delete copy[name];
            return copy;
          });
        }
      }
      return next;
    });
    setSaved(false);
  };

  const handleBlur = (name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    const def = defs.find((f) => f.name === name);
    if (!def) return;
    const error = validateField(def, values, t);
    setErrors((prev) => {
      const copy = { ...prev };
      if (error) copy[name] = error;
      else delete copy[name];
      return copy;
    });
  };

  /** Build the payload; switch to FormData when a File is present. */
  const buildPayload = (sourceValues: FormValues): Record<string, unknown> | FormData => {
    const source = transform ? transform(sourceValues) : { ...sourceValues };
    const hasFile = Object.values(source).some((v) => v instanceof File);
    if (!hasFile) return source;

    const formData = new FormData();
    for (const [key, value] of Object.entries(source)) {
      if (value === null || value === undefined) continue;
      if (value instanceof File) formData.append(key, value);
      else if (Array.isArray(value)) value.forEach((item) => formData.append(`${key}[]`, String(item)));
      else if (typeof value === "boolean") formData.append(key, value ? "1" : "0");
      else formData.append(key, String(value));
    }
    // Laravel needs a method spoof for multipart updates.
    if (isEdit) formData.append("_method", "PUT");
    return formData;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    const validationErrors = validateAll(activeFields, values, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setTouched(Object.fromEntries(activeFields.map((f) => [f.name, true])));
      return;
    }

    setSubmitting(true);
    try {
      /**
       * Guarantee: array fields always go out as option VALUES (ids) —
       * names ("users.create") and whole objects are resolved to ids
       * regardless of how they entered the state (create or edit).
       */
      const normalized: FormValues = { ...values };
      for (const f of defs) {
        if (isArrayField(f.type) && Array.isArray(normalized[f.name])) {
          normalized[f.name] = (normalized[f.name] as unknown[])
            .map((item) => resolveItemValue(f, item))
            .filter((v): v is string => Boolean(v));
        }
      }

      const payload = buildPayload(normalized);
      const record = singleton
        ? await saveSingleton(path, payload)
        : isEdit && !(payload instanceof FormData)
          ? await updateResource(path, recordId!, payload)
          : isEdit
            ? await createResource(`${path}/${recordId}`, payload) // POST + _method=PUT
            : await createResource(path, payload);

      setSaved(true);
      toast.success(t(isEdit || singleton ? "form.updated" : "form.created"));
      onSuccess?.(record);
      if (redirectTo) navigate(redirectTo);
    } catch (error) {
      if (error instanceof ApiError) {
        const data = error.data as { errors?: Record<string, string[]> } | undefined;
        if (data?.errors) {
          // Field-level validation errors stay inline — no toast noise.
          setErrors(
            Object.fromEntries(
              Object.entries(data.errors).map(([key, messages]) => [key, messages[0]]),
            ),
          );
        } else {
          setFormError(error.message);
          toast.error(error.message);
        }
      } else {
        setFormError(t("form.errors.generic"));
        toast.error(t("form.errors.generic"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* -------------------------------- render ------------------------------- */
  if (loading) return <LoadingPanel />;

  const visibleFields = activeFields.filter((f) => !f.hidden?.(values));

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      onSubmit={handleSubmit}
      noValidate
      className="surface-card overflow-hidden"
    >
      {(title || titleKey) && (
        <div className="border-b border-slate-200/70 px-[var(--pad-card)] py-4 dark:border-slate-800">
          <h1 className="font-display text-base font-bold text-slate-900 dark:text-white">
            {titleKey ? t(titleKey) : title}
          </h1>
          {(description || descriptionKey) && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {descriptionKey ? t(descriptionKey) : description}
            </p>
          )}
        </div>
      )}

      <div className="space-y-5 p-[var(--pad-card)]">
        {formError && (
          <div className="flex items-start gap-2 rounded-control bg-rose-500/10 px-3 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span dir="auto">{formError}</span>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          {visibleFields.map((fieldDef) => (
            <div key={fieldDef.name} className={widthClass(fieldDef)}>
              <FormFieldRenderer
                field={fieldDef}
                value={values[fieldDef.name]}
                values={values}
                error={errors[fieldDef.name]}
                options={optionsFor(fieldDef)}
                rawOptions={builderOptions[fieldDef.builderKey ?? fieldDef.name]}
                onChange={(value) => setValue(fieldDef.name, value)}
                onBlur={() => handleBlur(fieldDef.name)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200/70 px-[var(--pad-card)] py-4 dark:border-slate-800">
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            "flex items-center gap-2 rounded-control bg-gradient-to-r from-brand-600 to-accent-600 px-4 py-2.5 text-xs font-bold text-white",
            "shadow-lg shadow-brand-600/25 transition-transform hover:scale-[1.03] active:scale-[0.98]",
            "disabled:pointer-events-none disabled:opacity-60",
          )}
        >
          {submitting ? <Spinner size="xs" onBrand /> : <Save className="size-3.5" />}
          {t(submitLabelKey ?? (isEdit || singleton ? "form.update" : "form.create"))}
        </button>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-control border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="size-3.5 rtl:-scale-x-100" />
          {t("form.cancel")}
        </button>

        {saved && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <Check className="size-4" />
            {t("form.saved")}
          </span>
        )}
      </div>
    </motion.form>
  );
}
