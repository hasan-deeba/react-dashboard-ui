import type { LucideIcon } from "lucide-react";
import type {
  FieldDef,
  FieldType,
  FieldWidth,
  FormValue,
  FormValues,
  SelectOption,
} from "@/components/form/types";

/**
 * Fluent field builders (mirrors the table's `column` API).
 *
 *   field.text("name").labelKey("resources.users.name").required()
 *   field.multiselect("roles").builderKey("roles").required()
 */
export class FieldBuilder {
  readonly def: FieldDef;

  constructor(name: string, type: FieldType) {
    this.def = { name, type, rules: {} };
  }

  label(value: string): this {
    this.def.label = value;
    return this;
  }

  labelKey(value: string): this {
    this.def.labelKey = value;
    return this;
  }

  placeholder(value: string): this {
    this.def.placeholder = value;
    return this;
  }

  placeholderKey(value: string): this {
    this.def.placeholderKey = value;
    return this;
  }

  hint(value: string): this {
    this.def.hint = value;
    return this;
  }

  hintKey(value: string): this {
    this.def.hintKey = value;
    return this;
  }

  icon(value: LucideIcon): this {
    this.def.icon = value;
    return this;
  }

  /** Grid width — fields are half-width by default on wide screens. */
  width(value: FieldWidth): this {
    this.def.width = value;
    return this;
  }

  options(value: SelectOption[]): this {
    this.def.options = value;
    return this;
  }

  /** Load options from `{resource}/builder` under this key. */
  builderKey(value: string): this {
    this.def.builderKey = value;
    return this;
  }

  /**
   * Map builder items of any shape onto option value/label keys.
   * e.g. optionKeys({ value: "id", label: "product_name" })
   */
  optionKeys(keys: { value?: string; label?: string }): this {
    this.def.optionKeys = keys;
    return this;
  }

  required(value = true): this {
    this.def.rules = { ...this.def.rules, required: value };
    return this;
  }

  min(value: number): this {
    this.def.rules = { ...this.def.rules, min: value };
    return this;
  }

  max(value: number): this {
    this.def.rules = { ...this.def.rules, max: value };
    return this;
  }

  email(value = true): this {
    this.def.rules = { ...this.def.rules, email: value };
    return this;
  }

  /** Must match another field's value (e.g. password confirmation). */
  matches(fieldName: string): this {
    this.def.rules = { ...this.def.rules, matches: fieldName };
    return this;
  }

  validate(fn: (value: FormValue, values: FormValues) => string | undefined): this {
    this.def.rules = { ...this.def.rules, custom: fn };
    return this;
  }

  default(value: FormValue): this {
    this.def.defaultValue = value;
    return this;
  }

  disabled(value = true): this {
    this.def.disabled = value;
    return this;
  }

  /** Render only when creating / only when editing. */
  only(mode: "create" | "edit"): this {
    this.def.only = mode;
    return this;
  }

  hidden(fn: (values: FormValues) => boolean): this {
    this.def.hidden = fn;
    return this;
  }

  render(fn: NonNullable<FieldDef["render"]>): this {
    this.def.render = fn;
    return this;
  }
}

const make =
  (type: FieldType) =>
  (name: string): FieldBuilder =>
    new FieldBuilder(name, type);

export const field = {
  text: make("text"),
  email: make("email"),
  password: make("password"),
  number: make("number"),
  textarea: make("textarea"),
  select: make("select"),
  multiselect: make("multiselect"),
  /**
   * Grouped checkbox matrix — "pick many, arranged in groups".
   * Works for permissions, feature flags, categories, channels…
   */
  groupedCheckbox: make("grouped-checkbox"),
  switch: make("switch"),
  image: make("image"),
  date: make("date"),
  custom: make("custom"),
};

export type FieldInput = FieldBuilder | FieldDef;

export function normalizeFields(fields: FieldInput[]): FieldDef[] {
  return fields.map((f) => (f instanceof FieldBuilder ? f.def : f));
}
