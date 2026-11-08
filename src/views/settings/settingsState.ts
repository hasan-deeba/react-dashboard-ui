/**
 * Settings form state — pure helpers, no React.
 *
 * PURPOSE : keep per-field drafts, decide what is dirty, and build the
 *           request bodies. The API contract is strict about two things that
 *           live here:
 *             1. patches are PARTIAL — only changed keys are sent;
 *             2. image fields send a File (multipart) or null (JSON clear),
 *                never the URL the GET returned.
 * EXPORTS : draft types + buildDrafts(), isFieldDirty(), groupIsDirty(),
 *           anyDirty(), buildGroupPatch(), valueAtPath(), fieldDomId().
 * EDIT    : everything here is driven by the builder's dot-path keys so
 *           future fields work without code changes — do not hardcode keys.
 */

import type {
  SettingsFieldMeta,
  SettingsGroupMeta,
  SettingsPatch,
  SettingsValues,
  TranslatedText,
} from "@/types/settings";

/** Languages a translated field can hold — mirrors the backend locales. */
export type LangCode = "en" | "ar";
export const TRANSLATED_LANGS: readonly LangCode[] = ["en", "ar"] as const;

export interface ScalarDraft {
  kind: "scalar";
  /** Text, email, url, phone, color, version — "" stands for "no value". */
  value: string;
}
export interface BooleanDraft {
  kind: "boolean";
  value: boolean;
}
export interface TranslatedDraft {
  kind: "translated";
  en: string;
  ar: string;
}
/** Image state is kept apart from the display URL — see the file header. */
export type ImageStage =
  | { status: "unchanged" }
  | { status: "staged"; file: File }
  | { status: "removed" };
export interface ImageDraft {
  kind: "image";
  stage: ImageStage;
}

export type FieldDraft = ScalarDraft | BooleanDraft | TranslatedDraft | ImageDraft;
export type Drafts = Record<string, FieldDraft>;

export interface ImageUpload {
  key: string;
  file: File;
}

/* ------------------------------ path helpers ------------------------------ */

/** Walk a dot path ("apps.ios.version") — undefined when any hop is missing. */
export function valueAtPath(values: SettingsValues | null, key: string): unknown {
  let node: unknown = values;
  for (const part of key.split(".")) {
    if (!node || typeof node !== "object") return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return node;
}

function setPathValue(root: Record<string, unknown>, key: string, value: unknown): void {
  const parts = key.split(".");
  let node = root;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const next = node[parts[i]];
    if (!next || typeof next !== "object" || Array.isArray(next)) node[parts[i]] = {};
    node = node[parts[i]] as Record<string, unknown>;
  }
  node[parts[parts.length - 1]] = value;
}

/** Stable DOM id for focusing inputs (and aria wiring) from a dot path. */
export function fieldDomId(fieldKey: string, sub?: string): string {
  return `setting-${fieldKey}${sub ? `-${sub}` : ""}`;
}

/* ---------------------------- draft construction -------------------------- */

function toTranslatedDraft(raw: unknown, fallback: unknown): { en: string; ar: string } {
  const pick = (source: unknown): TranslatedText | null =>
    source && typeof source === "object" ? (source as TranslatedText) : null;
  const value = pick(raw) ?? pick(fallback);
  return { en: value?.en ?? "", ar: value?.ar ?? "" };
}

function toBoolean(raw: unknown, fallback: unknown): boolean {
  const source = raw === undefined || raw === null ? fallback : raw;
  return source === true || source === 1 || source === "1";
}

function toScalarString(raw: unknown, fallback: unknown): string {
  const source = raw === undefined ? fallback : raw;
  return typeof source === "string" ? source : source == null ? "" : String(source);
}

/** Initial draft for one builder field, hydrated from the loaded values. */
export function initialFieldDraft(
  field: SettingsFieldMeta,
  values: SettingsValues | null,
): FieldDraft {
  const raw = valueAtPath(values, field.key);
  switch (field.type) {
    case "BOOLEAN":
      return { kind: "boolean", value: toBoolean(raw, field.default) };
    case "TRANSLATABLE_TEXT":
      return { kind: "translated", ...toTranslatedDraft(raw, field.default) };
    case "IMAGE":
      // The URL itself is display-only state and lives in `values`.
      return { kind: "image", stage: { status: "unchanged" } };
    default:
      return { kind: "scalar", value: toScalarString(raw, field.default) };
  }
}

/** Drafts for every builder field, keyed by dot path. */
export function buildDrafts(
  groups: SettingsGroupMeta[],
  values: SettingsValues | null,
): Drafts {
  const drafts: Drafts = {};
  for (const group of groups) {
    for (const field of group.fields) drafts[field.key] = initialFieldDraft(field, values);
  }
  return drafts;
}

/* ------------------------------- dirty checks ----------------------------- */

/** Wire value for a scalar draft: an empty input clears nullable fields. */
function scalarWireValue(draft: string, nullable: boolean): string | null {
  return draft === "" && nullable ? null : draft;
}

export function isFieldDirty(
  field: SettingsFieldMeta,
  draft: FieldDraft,
  values: SettingsValues | null,
): boolean {
  const raw = valueAtPath(values, field.key);
  switch (draft.kind) {
    case "boolean":
      return draft.value !== toBoolean(raw, field.default);
    case "translated": {
      const loaded = toTranslatedDraft(raw, field.default);
      return draft.en !== loaded.en || draft.ar !== loaded.ar;
    }
    case "image":
      return draft.stage.status !== "unchanged";
    case "scalar":
      return (
        scalarWireValue(draft.value, field.nullable) !==
        scalarWireValue(toScalarString(raw, field.default), field.nullable)
      );
  }
}

export function dirtyFields(
  group: SettingsGroupMeta,
  drafts: Drafts,
  values: SettingsValues | null,
): SettingsFieldMeta[] {
  return group.fields.filter((field) => {
    const draft = drafts[field.key];
    return draft !== undefined && isFieldDirty(field, draft, values);
  });
}

export function groupIsDirty(
  group: SettingsGroupMeta,
  drafts: Drafts,
  values: SettingsValues | null,
): boolean {
  return dirtyFields(group, drafts, values).length > 0;
}

export function anyDirty(
  groups: SettingsGroupMeta[],
  drafts: Drafts,
  values: SettingsValues | null,
): boolean {
  return groups.some((group) => groupIsDirty(group, drafts, values));
}

/* ------------------------------- patch build ------------------------------ */

/**
 * Build one group's save requests: a nested JSON patch (scalars, booleans,
 * changed languages and image removals) plus one upload entry per staged
 * image. Untouched fields are omitted entirely.
 */
export function buildGroupPatch(
  group: SettingsGroupMeta,
  drafts: Drafts,
  values: SettingsValues | null,
): { patch: SettingsPatch; uploads: ImageUpload[] } {
  const tree: Record<string, unknown> = {};
  const uploads: ImageUpload[] = [];

  for (const field of dirtyFields(group, drafts, values)) {
    const draft = drafts[field.key]!;

    if (draft.kind === "image") {
      if (draft.stage.status === "staged") uploads.push({ key: field.key, file: draft.stage.file });
      else if (draft.stage.status === "removed") setPathValue(tree, field.key, null);
      continue;
    }

    if (draft.kind === "boolean") {
      // Real JSON booleans — never "true"/"false" strings.
      setPathValue(tree, field.key, draft.value);
      continue;
    }

    if (draft.kind === "translated") {
      const loaded = toTranslatedDraft(valueAtPath(values, field.key), field.default);
      const patch: { en?: string; ar?: string | null } = {};
      if (draft.en !== loaded.en) patch.en = draft.en;
      if (draft.ar !== loaded.ar) patch.ar = draft.ar === "" ? null : draft.ar;
      if (Object.keys(patch).length > 0) setPathValue(tree, field.key, patch);
      continue;
    }

    setPathValue(tree, field.key, scalarWireValue(draft.value, field.nullable));
  }

  // The tree mirrors SettingsPatch by construction — the walk above only
  // ever writes registry-declared keys with their wire-typed values.
  return { patch: tree as unknown as SettingsPatch, uploads };
}
