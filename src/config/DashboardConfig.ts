/**
 * Per-deployment identity.
 *
 * PURPOSE : the ONLY file to edit when spinning this dashboard up for a new
 *           company. Everything here defines defaults; end users can still
 *           personalise via the Theme Studio, and "Reset" returns to exactly
 *           these values.
 * EXPORTS : CompanyConfig, DashboardConfig.
 * EDIT    : adding a field means updating the interface and the object.
 *           Consumers: BrandThemeContext (preset + overrides + theming lock),
 *           sidebar/header/auth layouts (logo), route guards (requireAuth).
 *
 * NOTE    : display names are NOT here — they live in the locale files under
 *           the `general.app` namespace so they can be translated.
 */

import { Zap, type LucideIcon } from "lucide-react";
import { DEFAULT_PRESET_ID } from "@/theme/presets";
import type { ThemeConfig } from "@/theme/types";

export interface CompanyConfig {
  /** Logo mark rendered in the sidebar, header and auth screens. */
  logo: LucideIcon;
  /** Theme preset the dashboard ships with (see `@/theme/presets`). */
  defaultPresetId: string;
  /** Hard token overrides applied on top of the preset (e.g. exact brand hex). */
  themeOverrides: Partial<ThemeConfig>;
  /** Allow end users to open the Theme Studio; false locks the company look. */
  allowUserTheming: boolean;
  supportEmail: string;
  /** Redirect unauthenticated visitors to /login. */
  requireAuth: boolean;
}

export const DashboardConfig: CompanyConfig = {
  logo: Zap,
  defaultPresetId: DEFAULT_PRESET_ID,
  themeOverrides: {
    // brandColor: "#6366f1",
    // accentColor: "#a855f7",
  },
  allowUserTheming: true,
  supportEmail: "hasan@gmail.com",
  requireAuth: true,
};
