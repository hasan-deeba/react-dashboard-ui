/**
 * GLOBAL form inputs — one consistent field treatment across every section.
 *
 * PURPOSE : import from "@/components/form/inputs" (or the "@/components/form"
 *           public barrel) anywhere in the app and get the same label /
 *           hint / error chrome and behaviour:
 *             - FieldLabel / FieldError / FieldHint / inputClass — chrome
 *             - TextField / PasswordField / Switch — scalar atoms
 *             - SwitchField        — labelled boolean row
 *             - RichTextEditor     — WYSIWYG writing Markdown under the hood
 *             - ImageUploadField   — single image (thumbnail, validation)
 *             - FileUploadField    — multi files: image tiles or doc rows
 *             - MultiSelect / GroupedCheckbox — set pickers
 * EDIT    : inputs must stay feature-agnostic (no per-section imports) —
 *           adapters in each section map their own state/meta onto the
 *           generic props.
 */

export * from "./FieldChrome";
export * from "./Switch";
export * from "./TextFields";
export * from "./SwitchField";
export * from "./RichTextEditor";
export * from "./ImageUploadField";
export * from "./FileUploadField";
export {
  IMAGE_EXTENSIONS,
  DEFAULT_IMAGE_ACCEPT,
  DEFAULT_MAX_KB,
  DEFAULT_MAX_DIMENSION,
  extensionOf,
  isImageExtension,
  probeDimensions,
  validateFileSync,
} from "./uploadUtils";
export type { FileTypeIssue } from "./uploadUtils";
export { htmlToMarkdown, markdownToEditorHtml } from "./richText";
