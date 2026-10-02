import type { Density, IconShape, RadiusScale, ThemeConfig } from "./types";

/* ------------------------------ colour utils ------------------------------ */

interface Hsl {
  h: number;
  s: number;
  l: number;
}

function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;

  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min);
    if (max === r) h = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / delta + 2) * 60;
    else h = ((r - g) / delta + 4) * 60;
  }

  return { h, s: s * 100, l: l * 100 };
}

/** Target lightness for each Tailwind-style shade. */
const SHADES: Record<number, number> = {
  50: 97,
  100: 94,
  200: 87,
  300: 78,
  400: 67,
  500: 57,
  600: 49,
  700: 41,
  800: 33,
  900: 27,
  950: 17,
};

/** Build a 50→950 ramp that preserves the hue of the chosen brand colour. */
function buildRamp(hex: string): Record<number, string> {
  const { h, s } = hexToHsl(hex);
  const ramp: Record<number, string> = {};

  for (const [shade, lightness] of Object.entries(SHADES)) {
    // Desaturate the extremes so tints/shades stay natural.
    const distance = Math.abs(lightness - 57) / 57;
    const saturation = Math.max(12, Math.min(96, s * (1 - distance * 0.35)));
    ramp[Number(shade)] = `hsl(${h.toFixed(1)} ${saturation.toFixed(1)}% ${lightness}%)`;
  }

  return ramp;
}

/** Readable foreground (white / near-black) for a given background hex. */
function contrastOn(hex: string): string {
  const { l } = hexToHsl(hex);
  return l > 65 ? "#0f172a" : "#ffffff";
}

/* ------------------------------ token tables ------------------------------ */

const RADIUS_TOKENS: Record<RadiusScale, { card: string; control: string }> = {
  sharp: { card: "0.25rem", control: "0.25rem" },
  soft: { card: "0.75rem", control: "0.5rem" },
  rounded: { card: "1rem", control: "0.75rem" },
  pill: { card: "1.75rem", control: "1rem" },
};

const ICON_RADIUS: Record<IconShape, string> = {
  rounded: "0.75rem",
  circle: "9999px",
  squircle: "1.15rem",
  sharp: "0.125rem",
};

const DENSITY_TOKENS: Record<Density, { card: string; navY: string; gap: string }> = {
  comfortable: { card: "1.25rem", navY: "0.625rem", gap: "1.25rem" },
  compact: { card: "0.875rem", navY: "0.4rem", gap: "0.875rem" },
};

/* -------------------------------- applyTheme ------------------------------- */

/**
 * Writes the resolved theme to the document as CSS variables + data
 * attributes. This is the single place where tokens touch the DOM.
 */
export function applyTheme(config: ThemeConfig): void {
  const root = document.documentElement;

  const brand = buildRamp(config.brandColor);
  const accent = buildRamp(config.accentColor);

  for (const [shade, value] of Object.entries(brand)) {
    root.style.setProperty(`--brand-${shade}`, value);
  }
  for (const [shade, value] of Object.entries(accent)) {
    root.style.setProperty(`--accent-${shade}`, value);
  }

  root.style.setProperty("--brand-base", config.brandColor);
  root.style.setProperty("--accent-base", config.accentColor);
  root.style.setProperty("--brand-contrast", contrastOn(config.brandColor));

  const radius = RADIUS_TOKENS[config.radius];
  root.style.setProperty("--r-card", radius.card);
  root.style.setProperty("--r-control", radius.control);
  root.style.setProperty("--r-icon", ICON_RADIUS[config.iconShape]);

  const density = DENSITY_TOKENS[config.density];
  root.style.setProperty("--pad-card", density.card);
  root.style.setProperty("--pad-nav-y", density.navY);
  root.style.setProperty("--gap-grid", density.gap);

  root.dataset.surface = config.surface;
  root.dataset.sidebar = config.sidebar;
  root.dataset.header = config.header;
  root.dataset.density = config.density;
}
