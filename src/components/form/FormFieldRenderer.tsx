import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { InlineSelect } from "@/components/table/InlineSelect";
import { PasswordField, TextField } from "@/components/form/inputs/TextFields";
import { ImageUploadField } from "@/components/form/inputs/ImageUploadField";
import { RichTextEditor } from "@/components/form/inputs/RichTextEditor";
import { SwitchField } from "@/components/form/inputs/SwitchField";
import { MultiSelect } from "@/components/form/inputs/MultiSelect";
import { GroupedCheckbox, normalizeGroups } from "@/components/form/inputs/GroupedCheckbox";
import { cn } from "@/utils/cn";
import type { FieldDef, FormValue, FormValues, SelectOption } from "@/components/form/types";

interface FormFieldRendererProps {
  field: FieldDef;
  value: FormValue;
  values: FormValues;
  error?: string;
  options: SelectOption[];
  /** Raw builder items for this field's key (used by grouped inputs). */
  rawOptions?: unknown[];
  onChange: (value: FormValue) => void;
  onBlur: () => void;
}

/** Renders a single field according to its declared type. */
export function FormFieldRenderer({
  field,
  value,
  error,
  options,
  rawOptions,
  onChange,
  onBlur,
}: FormFieldRendererProps) {
  const { t } = useLanguage();

  const label = field.labelKey ? t(field.labelKey) : (field.label ?? field.name);
  const placeholder = field.placeholderKey ? t(field.placeholderKey) : field.placeholder;
  const hint = field.hintKey ? t(field.hintKey) : field.hint;
  const required = Boolean(field.rules?.required);

  /* Custom control — caller owns everything. */
  if (field.render) {
    return (
      <LabelWrapper label={label} required={required} error={error} hint={hint}>
        {field.render({ value, setValue: onChange, error })}
      </LabelWrapper>
    );
  }

  switch (field.type) {
    case "password":
      return (
        <PasswordField
          label={withAsterisk(label, required)}
          placeholder={placeholder}
          hint={hint}
          error={error}
          disabled={field.disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      );

    case "textarea":
      return (
        <LabelWrapper label={label} required={required} error={error} hint={hint}>
          <textarea
            rows={4}
            placeholder={placeholder}
            disabled={field.disabled}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            className={cn(
              "w-full resize-y rounded-control border bg-slate-50/80 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition-all",
              "placeholder:text-slate-400 focus:bg-white focus:ring-4",
              "dark:bg-slate-800/60 dark:text-white dark:focus:bg-slate-900",
              error
                ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/10"
                : "border-slate-200 focus:border-brand-500/60 focus:ring-brand-500/10 dark:border-slate-700",
            )}
          />
        </LabelWrapper>
      );

    case "select":
      return (
        <LabelWrapper label={label} required={required} error={error} hint={hint}>
          <InlineSelect
            options={options}
            value={(value as string) ?? ""}
            onChange={(next) => onChange(next)}
            allLabel={placeholder ?? t("form.selectPlaceholder")}
            active={Boolean(value)}
            className="w-full [&>button]:w-full [&>button]:justify-between"
          />
        </LabelWrapper>
      );

    case "multiselect":
      return (
        <LabelWrapper label={label} required={required} error={error} hint={hint}>
          <MultiSelect
            options={options}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(next) => onChange(next)}
            placeholder={placeholder}
            error={Boolean(error)}
            disabled={field.disabled}
          />
        </LabelWrapper>
      );

    case "grouped-checkbox":
      return (
        <LabelWrapper label={label} required={required} error={error} hint={hint}>
          <GroupedCheckbox
            groups={normalizeGroups(rawOptions ?? [], field.optionKeys)}
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(next: string[]) => onChange(next)}
            disabled={field.disabled}
          />
        </LabelWrapper>
      );

    case "switch":
      return (
        <SwitchField
          label={label}
          hint={hint}
          error={error}
          checked={Boolean(value)}
          onChange={(next) => onChange(next)}
          disabled={field.disabled}
        />
      );

    case "image":
      return (
        <LabelWrapper label={label} required={required} error={error} hint={hint}>
          <DynamicImageField
            value={value as string | File | null}
            onChange={(next) => onChange(next)}
            disabled={field.disabled}
          />
        </LabelWrapper>
      );

    case "richtext":
      return (
        <LabelWrapper label={label} required={required} error={error} hint={hint}>
          <RichTextEditor
            value={(value as string) ?? ""}
            onChange={(markdown) => onChange(markdown)}
            disabled={field.disabled}
            hasError={Boolean(error)}
            dir={document.documentElement.dir === "rtl" ? "rtl" : "ltr"}
          />
        </LabelWrapper>
      );

    case "number":
      return (
        <TextField
          type="number"
          label={withAsterisk(label, required)}
          placeholder={placeholder}
          hint={hint}
          error={error}
          icon={field.icon}
          disabled={field.disabled}
          value={(value as number | string) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
          onBlur={onBlur}
        />
      );

    case "date":
      return (
        <TextField
          type="date"
          label={withAsterisk(label, required)}
          hint={hint}
          error={error}
          icon={field.icon}
          disabled={field.disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      );

    default:
      return (
        <TextField
          type={field.type === "email" ? "email" : "text"}
          label={withAsterisk(label, required)}
          placeholder={placeholder}
          hint={hint}
          error={error}
          icon={field.icon}
          disabled={field.disabled}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
        />
      );
  }
}

function withAsterisk(label: string, required: boolean): string {
  return required ? `${label} *` : label;
}

/** Shared label + error/hint chrome for non-input controls. */
function LabelWrapper({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
        {withAsterisk(label, Boolean(required))}
      </label>
      {children}
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
}

/**
 * Adapter: a DynamicForm "image" value (url | File | null) maps onto
 * ImageUploadField's staging model. Client-side file issues are local —
 * the form-level validation error stays in the LabelWrapper chrome.
 */
function DynamicImageField({
  value,
  onChange,
  disabled,
}: {
  value: string | File | null;
  onChange: (next: string | File | null) => void;
  disabled?: boolean;
}) {
  const [fileIssue, setFileIssue] = useState<string | null>(null);
  return (
    <ImageUploadField
      valueUrl={typeof value === "string" && value ? value : null}
      stagedFile={value instanceof File ? value : null}
      error={fileIssue ?? undefined}
      disabled={disabled}
      onStage={(file) => {
        setFileIssue(null);
        onChange(file);
      }}
      onRemove={() => onChange(null)}
      onUndo={() => undefined /* DynamicForm values keep no removal memory */}
      onError={setFileIssue}
    />
  );
}
