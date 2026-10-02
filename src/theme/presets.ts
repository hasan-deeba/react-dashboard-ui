import type { ThemePreset } from "./types";

/**
 * Three shipped presets. Each one changes the *layout* (sidebar + header
 * variant), the surface treatment, the corner language and the palette —
 * not just colours.
 */
export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "nova",
    labelKey: "nova",
    brandColor: "#6366f1",
    accentColor: "#a855f7",
    radius: "rounded",
    iconShape: "rounded",
    density: "comfortable",
    surface: "glass",
    sidebar: "classic",
    header: "standard",
  },
  {
    id: "atlas",
    labelKey: "atlas",
    brandColor: "#10b981",
    accentColor: "#0ea5e9",
    radius: "pill",
    iconShape: "circle",
    density: "comfortable",
    surface: "soft",
    sidebar: "floating",
    header: "minimal",
  },
  {
    id: "quartz",
    labelKey: "quartz",
    brandColor: "#f97316",
    accentColor: "#e11d48",
    radius: "sharp",
    iconShape: "sharp",
    density: "compact",
    surface: "solid",
    sidebar: "rail",
    header: "split",
  },
];

export const DEFAULT_PRESET_ID = "nova";

export function getPreset(id: string): ThemePreset {
  return (
    THEME_PRESETS.find((preset) => preset.id === id) ??
    THEME_PRESETS.find((preset) => preset.id === DEFAULT_PRESET_ID)!
  );
}

/** Curated brand colours offered in the Theme Studio swatch picker. */
export const BRAND_SWATCHES = [
  "#6366f1",
  "#3b82f6",
  "#0ea5e9",
  "#10b981",
  "#84cc16",
  "#f59e0b",
  "#f97316",
  "#ef4444",
  "#ec4899",
  "#a855f7",
  "#64748b",
  "#0f172a",
];
