/**
 * CMS settings endpoints (singleton application settings).
 *
 * PURPOSE : wraps the three settings routes in typed calls:
 *             GET  settings          → SettingsValues
 *             GET  settings/builder  → SettingsBuilderResponse
 *             POST settings          → SettingsSaveResponse (JSON or multipart)
 * EXPORTS : fetchSettings(), fetchSettingsBuilder(), saveSettings(),
 *           uploadSettingImage().
 * EDIT    : these responses are BARE objects — no `item`/`data` envelope —
 *           so they intentionally bypass the unwrapping helpers in
 *           `services/resources.ts` (those serve the CrudService contract).
 *           The base URL already ends in `/cms` (VITE_API_BASE_URL), the
 *           shared client attaches Authorization / Accept / Accept-Language,
 *           and it drops Content-Type for FormData so the browser sets the
 *           multipart boundary — do not set it manually.
 */

import api from "@/services/api";
import type {
  SettingsBuilderResponse,
  SettingsPatch,
  SettingsSaveResponse,
  SettingsValues,
} from "@/types/settings";

const RESOURCE = "settings";

/** Current values, all five groups, defaults filled in. */
export const fetchSettings = (): Promise<SettingsValues> =>
  api.get<SettingsValues>(RESOURCE);

/** Form blueprint (groups in display order, labels in the active language). */
export const fetchSettingsBuilder = (): Promise<SettingsBuilderResponse> =>
  api.get<SettingsBuilderResponse>(`${RESOURCE}/builder`);

/**
 * Save non-image changes — Content-Type: application/json, nested partial
 * body (only the keys that changed). Image clearing (`null`) rides along here.
 */
export const saveSettings = (patch: SettingsPatch): Promise<SettingsSaveResponse> =>
  api.post<SettingsSaveResponse>(RESOURCE, patch);

/**
 * Upload ONE new image per request as multipart/form-data with bracket field
 * names (`branding[app_icon]`). Never send an existing URL back — the server
 * only accepts real files or an explicit JSON `null`.
 */
export const uploadSettingImage = (
  fieldKey: string,
  file: File,
): Promise<SettingsSaveResponse> => {
  const [head, ...rest] = fieldKey.split(".");
  const bracketName = head + rest.map((part) => `[${part}]`).join("");
  const formData = new FormData();
  formData.append(bracketName, file);
  return api.upload<SettingsSaveResponse>(RESOURCE, formData);
};
