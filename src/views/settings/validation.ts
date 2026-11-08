/**
 * Client-side validation for the settings form.
 *
 * PURPOSE : mirrors the server's rules so bad input never becomes a request:
 *           color/version/url/phone/email formats, per-language lengths, and
 *           the update-lock cross-field rule (a platform whose lock is on —
 *           saved state plus pending edits — needs a version AND a store URL).
 * EXPORTS : FieldIssue, validateFieldDraft(), validateGroup(),
 *           lockPrerequisites().
 * EDIT    : the builder carries formats/limits (`max_length`, `accept`…);
 *           only fall back to the constants below when the builder omits them.
 *           The server stays authoritative — this layer exists for UX.
 */

import type { SettingsFieldMeta, SettingsGroupMeta } from "@/types/settings";
import type { Drafts, FieldDraft } from "@/views/settings/settingsState";

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** A single failing input — `sub` pinpoints one language of a translated field. */
export interface FieldIssue {
  key: string;
  sub?: "en" | "ar";
  message: string;
}

const VERSION_RE = /^(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})\.(0|[1-9][0-9]{0,8})$/;
const URL_RE = /^https?:\/\/\S+/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9 ().-]+$/;

/** Contract fallbacks when the builder omits `max_length`. */
const FALLBACK_MAX: Record<string, number> = {
  EMAIL: 254,
  PHONE: 40,
  URL: 2048,
  VERSION: 32,
  TRANSLATABLE_MARKDOWN: 50000,
};

function maxFor(field: SettingsFieldMeta): number | undefined {
  return field.max_length ?? FALLBACK_MAX[field.type];
}

/** Validate one field's current draft; returns every issue (usually ≤ 1). */
export function validateFieldDraft(
  field: SettingsFieldMeta,
  draft: FieldDraft,
  t: Translate,
): FieldIssue[] {
  const issues: FieldIssue[] = [];

  if (draft.kind === "translated") {
    // TRANSLATABLE_TEXT: `en` is required and non-empty, `ar` optional.
    // TRANSLATABLE_MARKDOWN (legal docs): BOTH languages are optional —
    // an empty document just falls back to the external link.
    if (field.type === "TRANSLATABLE_TEXT" && draft.en.trim() === "") {
      issues.push({ key: field.key, sub: "en", message: t("settings.validation.englishRequired") });
    }
    const max = maxFor(field);
    if (max) {
      if (draft.en.length > max) {
        issues.push({ key: field.key, sub: "en", message: t("form.validation.max", { max }) });
      }
      if (draft.ar.length > max) {
        issues.push({ key: field.key, sub: "ar", message: t("form.validation.max", { max }) });
      }
    }
    return issues;
  }

  if (draft.kind !== "scalar") return issues;

  const value = draft.value;
  if (value === "") {
    // Nullable scalars clear with an empty input; non-nullable must be filled.
    if (!field.nullable) issues.push({ key: field.key, message: t("form.validation.required") });
    return issues;
  }

  switch (field.type) {
    case "VERSION":
      if (!VERSION_RE.test(value)) issues.push({ key: field.key, message: t("settings.validation.version") });
      break;
    case "URL":
      if (!URL_RE.test(value)) issues.push({ key: field.key, message: t("settings.validation.url") });
      break;
    case "EMAIL":
      if (!EMAIL_RE.test(value)) issues.push({ key: field.key, message: t("form.validation.email") });
      break;
    case "PHONE":
      if (!PHONE_RE.test(value)) issues.push({ key: field.key, message: t("settings.validation.phone") });
      break;
    default:
      break;
  }

  const max = maxFor(field);
  if (issues.length === 0 && max && value.length > max) {
    issues.push({ key: field.key, message: t("form.validation.max", { max }) });
  }
  return issues;
}

/**
 * Lock prerequisites for one platform: evaluated from drafts, which combine
 * the saved values with the pending edits — the same merged view the server
 * validates against. `lockKey` is a `*.lock_for_update` dot path; the result
 * tells which sibling keys (version / store_url) are empty.
 */
export function lockPrerequisites(
  lockKey: string,
  group: SettingsGroupMeta,
  drafts: Drafts,
): { lockOn: boolean; missing: string[] } {
  const prefix = lockKey.slice(0, lockKey.lastIndexOf("."));
  const lock = drafts[lockKey];
  if (lock?.kind !== "boolean" || !lock.value) return { lockOn: false, missing: [] };

  const missing: string[] = [];
  for (const suffix of ["version", "store_url"]) {
    const key = `${prefix}.${suffix}`;
    if (!group.fields.some((f) => f.key === key)) continue; // not part of this form
    const draft = drafts[key];
    if (draft?.kind === "scalar" && draft.value.trim() === "") missing.push(key);
  }
  return { lockOn: true, missing };
}

/**
 * Validate a whole group before saving: per-field rules for every field,
 * then the cross-field guard for each `*.lock_for_update` toggle — so
 * enabling a lock, or clearing a version/URL while locked, fails here before
 * any request is sent.
 */
export function validateGroup(
  group: SettingsGroupMeta,
  drafts: Drafts,
  t: Translate,
): FieldIssue[] {
  const issues: FieldIssue[] = [];
  for (const field of group.fields) {
    const draft = drafts[field.key];
    if (draft) issues.push(...validateFieldDraft(field, draft, t));
  }

  for (const field of group.fields) {
    if (field.type !== "BOOLEAN" || !field.key.endsWith(".lock_for_update")) continue;
    const { missing } = lockPrerequisites(field.key, group, drafts);
    for (const key of missing) {
      issues.push({
        key,
        message: key.endsWith(".version")
          ? t("settings.validation.lockNeedsVersion")
          : t("settings.validation.lockNeedsStore"),
      });
    }
  }
  return issues;
}
