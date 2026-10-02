/**
 * Design-token contract.
 *
 * Everything visual that may differ between companies lives in a `ThemeConfig`.
 * Components never hardcode brand colours, radii or layout decisions — they
 * consume the CSS variables / data-attributes produced from this object.
 */

export type SidebarVariant = "classic" | "floating" | "rail";
export type HeaderVariant = "standard" | "minimal" | "split";
export type IconShape = "rounded" | "circle" | "squircle" | "sharp";
export type RadiusScale = "sharp" | "soft" | "rounded" | "pill";
export type Density = "comfortable" | "compact";
export type SurfaceStyle = "glass" | "solid" | "soft";

export interface ThemeConfig {
  /** Primary brand colour (hex) — the full 50→950 ramp is generated from it. */
  brandColor: string;
  /** Secondary colour used in gradients and accents (hex). */
  accentColor: string;
  radius: RadiusScale;
  iconShape: IconShape;
  density: Density;
  surface: SurfaceStyle;
  sidebar: SidebarVariant;
  header: HeaderVariant;
}

export interface ThemePreset extends ThemeConfig {
  id: string;
  /** i18n key suffix — resolved as `theme.presets.<id>.name` / `.description`. */
  labelKey: string;
}

/** What the Theme Studio persists: a preset plus any user overrides. */
export interface StoredTheme {
  presetId: string;
  overrides: Partial<ThemeConfig>;
}
