import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/**
 * Form contracts.
 *
 * Pages declare *what* to capture with field builders (`fields.ts`);
 * `DynamicForm` decides how to render, validate and submit it.
 */

export type FieldType =
  | "text"
  | "email"
  | "password"
  | "number"
  | "textarea"
  | "select"
  | "multiselect"
  | "grouped-checkbox"
  | "switch"
  | "image"
  | "date"
  | "custom";

export type FieldWidth = "full" | "half";

export interface SelectOption {
  value: string;
  label: string;
}

export type FormValue = string | number | boolean | string[] | File | null | undefined;
export type FormValues = Record<string, FormValue>;

export interface ValidationRules {
  required?: boolean;
  min?: number;
  max?: number;
  email?: boolean;
  /** Must equal the value of another field (password confirmation). */
  matches?: string;
  /** Return an error message, or undefined when valid. */
  custom?: (value: FormValue, values: FormValues) => string | undefined;
}

export interface FieldDef {
  name: string;
  type: FieldType;
  label?: string;
  labelKey?: string;
  placeholder?: string;
  placeholderKey?: string;
  hint?: string;
  hintKey?: string;
  icon?: LucideIcon;
  width?: FieldWidth;
  options?: SelectOption[];
  /** Pull options from `{resource}/builder` under this key. */
  builderKey?: string;
  /**
   * Map builder items of ANY shape onto option values/labels —
   * e.g. { value: "id", label: "product_name" } or { value: "price", label: "name" }.
   * Labels arrive already translated from the backend.
   */
  optionKeys?: { value?: string; label?: string };
  rules?: ValidationRules;
  defaultValue?: FormValue;
  disabled?: boolean;
  /** Only render on create / only on edit. */
  only?: "create" | "edit";
  /** Hide dynamically based on the current values. */
  hidden?: (values: FormValues) => boolean;
  /** Fully custom control. */
  render?: (args: {
    value: FormValue;
    setValue: (value: FormValue) => void;
    error?: string;
  }) => ReactNode;
}

export interface FormSection {
  titleKey?: string;
  title?: string;
  descriptionKey?: string;
  description?: string;
  fields: FieldDef[];
}
