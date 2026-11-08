/**
 * CMS settings contract (Laravel backend).
 *
 * PURPOSE : the exact wire shapes of the settings endpoints:
 *             GET  settings          → SettingsValues (bare object, no envelope)
 *             GET  settings/builder  → SettingsBuilderResponse (bare object)
 *             POST settings          → SettingsSaveResponse ({ message, code })
 * EXPORTS : SettingsValues + per-group shapes, SettingsBuilderResponse,
 *           SettingsFieldMeta, SettingsPatch (+ per-group patches) and
 *           SettingsSaveResponse.
 * EDIT    : never extend these with fields the API does not return or accept
 *           — unknown keys are rejected server-side with a 422. Image fields
 *           are `string | null` on reads and `null` (clear) in JSON patches;
 *           uploads travel as multipart FormData and are typed in the view
 *           layer, not here.
 */

/** Translated string — `en` is always present, `ar` may be null. */
export interface TranslatedText {
  en: string;
  ar: string | null;
}

export interface BrandingSettings {
  app_name: TranslatedText;
  /** Absolute URL of the stored image, or null when unset. */
  app_icon: string | null;
  logo: string | null;
  favicon: string | null;
  /** `#RRGGBB` — nullable. */
  primary_color: string | null;
}

export interface SupportSettings {
  email: string | null;
  phone: string | null;
  website_url: string | null;
}

export interface LegalSettings {
  privacy_policy_url: string | null;
  terms_url: string | null;
}

export interface AvailabilitySettings {
  maintenance_enabled: boolean;
  maintenance_message: TranslatedText;
  registration_enabled: boolean;
}

export interface PlatformUpdateSettings {
  version: string | null;
  lock_for_update: boolean;
  store_url: string | null;
  update_message: TranslatedText;
}

export interface AppsSettings {
  ios: PlatformUpdateSettings;
  android: PlatformUpdateSettings;
}

/** `GET /settings` — all five groups always present, top level. */
export interface SettingsValues {
  branding: BrandingSettings;
  support: SupportSettings;
  legal: LegalSettings;
  availability: AvailabilitySettings;
  apps: AppsSettings;
}

/* --------------------------------- builder -------------------------------- */

/** Field types the API can declare. Unknown future types must still render. */
export type SettingsFieldType =
  | "TEXT"
  | "TRANSLATABLE_TEXT"
  | "BOOLEAN"
  | "IMAGE"
  | "EMAIL"
  | "URL"
  | "PHONE"
  | "COLOR"
  | "VERSION";

/** A default as declared by the builder: scalar, boolean or translated pair. */
export type SettingsFieldDefault = string | boolean | TranslatedText | null;

export interface SettingsFieldMeta {
  /** Dot path — also the form path and the 422 error key, e.g. "apps.ios.version". */
  key: string;
  /** A SettingsFieldType; kept as string so unknown types degrade gracefully. */
  type: string;
  /** Server-translated label (Accept-Language) — never retranslate it. */
  label: string;
  is_public: boolean;
  nullable: boolean;
  default: SettingsFieldDefault;
  /** Present only when relevant. */
  max_length?: number;
  accept?: string[];
  max_kilobytes?: number;
  format?: string;
}

export interface SettingsGroupMeta {
  key: string;
  label: string;
  fields: SettingsFieldMeta[];
}

/** `GET /settings/builder` — groups in display order; maps keyed by value. */
export interface SettingsBuilderResponse {
  groups: SettingsGroupMeta[];
  types: Record<string, string>;
  platforms: Record<string, string>;
}

/* --------------------------------- payload -------------------------------- */

/** JSON patch for a translated field — send only the languages that changed. */
export interface TranslatedTextPatch {
  en?: string;
  ar?: string | null;
}

export interface BrandingPatch {
  app_name?: TranslatedTextPatch;
  /** JSON can only CLEAR an image (null); new files go via multipart. */
  app_icon?: null;
  logo?: null;
  favicon?: null;
  primary_color?: string | null;
}

export type SupportPatch = Partial<SupportSettings>;
export type LegalPatch = Partial<LegalSettings>;

export interface AvailabilityPatch {
  maintenance_enabled?: boolean;
  maintenance_message?: TranslatedTextPatch;
  registration_enabled?: boolean;
}

export interface PlatformUpdatePatch {
  version?: string | null;
  lock_for_update?: boolean;
  store_url?: string | null;
  update_message?: TranslatedTextPatch;
}

/**
 * Partial nested update body for `POST /settings` — every key is `sometimes`-
 * style optional and omitted keys stay untouched server-side.
 */
export interface SettingsPatch {
  branding?: BrandingPatch;
  support?: SupportPatch;
  legal?: LegalPatch;
  availability?: AvailabilityPatch;
  apps?: {
    ios?: PlatformUpdatePatch;
    android?: PlatformUpdatePatch;
  };
}

/** `POST /settings` success — a message only, never the saved data. */
export interface SettingsSaveResponse {
  message: string;
  code: number;
}
