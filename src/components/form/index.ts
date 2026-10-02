/** Public API of the form module. */
export { DynamicForm, type DynamicFormProps } from "@/components/form/DynamicForm";
export { field, FieldBuilder, normalizeFields, type FieldInput } from "@/components/form/fields";
export { MultiSelect } from "@/components/form/inputs/MultiSelect";
export { ImageInput } from "@/components/form/inputs/ImageInput";
export {
  GroupedCheckbox,
  normalizeGroups,
  type CheckboxGroup,
} from "@/components/form/inputs/GroupedCheckbox";
export { validateAll, validateField } from "@/components/form/validate";
export type {
  FieldDef,
  FieldType,
  FormValue,
  FormValues,
  SelectOption,
  ValidationRules,
} from "@/components/form/types";
