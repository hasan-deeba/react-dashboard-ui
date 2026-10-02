import type { FieldDef, FormValues } from "@/components/form/types";

type Translate = (key: string, params?: Record<string, string | number>) => string;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

/** Validate one field, returning an error message or undefined. */
export function validateField(
  fieldDef: FieldDef,
  values: FormValues,
  t: Translate,
): string | undefined {
  const rules = fieldDef.rules ?? {};
  const value = values[fieldDef.name];

  if (rules.required && isEmpty(value) && typeof value !== "boolean") {
    return t("form.validation.required");
  }

  // Remaining rules only apply to filled values.
  if (isEmpty(value)) return rules.custom?.(value, values);

  if (rules.email && typeof value === "string" && !EMAIL_RE.test(value)) {
    return t("form.validation.email");
  }

  if (rules.min !== undefined) {
    if (typeof value === "string" && value.length < rules.min) {
      return t("form.validation.min", { min: rules.min });
    }
    if (typeof value === "number" && value < rules.min) {
      return t("form.validation.minValue", { min: rules.min });
    }
  }

  if (rules.max !== undefined) {
    if (typeof value === "string" && value.length > rules.max) {
      return t("form.validation.max", { max: rules.max });
    }
    if (typeof value === "number" && value > rules.max) {
      return t("form.validation.maxValue", { max: rules.max });
    }
  }

  if (rules.matches && values[rules.matches] !== value) {
    return t("form.validation.match");
  }

  return rules.custom?.(value, values);
}

/** Validate every visible field. */
export function validateAll(
  fields: FieldDef[],
  values: FormValues,
  t: Translate,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const fieldDef of fields) {
    if (fieldDef.hidden?.(values)) continue;
    const error = validateField(fieldDef, values, t);
    if (error) errors[fieldDef.name] = error;
  }
  return errors;
}
