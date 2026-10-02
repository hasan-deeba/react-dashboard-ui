import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DashboardConfig } from "@/config/DashboardConfig";
import { applyTheme } from "@/theme/applyTheme";
import { getPreset, THEME_PRESETS } from "@/theme/presets";
import type { StoredTheme, ThemeConfig, ThemePreset } from "@/theme/types";

const STORAGE_KEY = "pulse-brand-theme";

interface BrandThemeContextValue {
  /** Fully resolved tokens currently applied to the document. */
  config: ThemeConfig;
  presets: ThemePreset[];
  activePresetId: string;
  /** True when the user has customised anything on top of the preset. */
  isCustomised: boolean;
  selectPreset: (presetId: string) => void;
  /** Patch one or more tokens (e.g. `{ brandColor: "#10b981" }`). */
  update: (patch: Partial<ThemeConfig>) => void;
  /** Back to the dashboard default defined in `config/dashboardConfig.ts`. */
  reset: () => void;
}

const BrandThemeContext = createContext<BrandThemeContextValue | null>(null);

/** The dashboard default = its preset + any hard overrides from the config. */
function dashboardDefault(): StoredTheme {
  return {
    presetId: DashboardConfig.defaultPresetId,
    overrides: { ...DashboardConfig.themeOverrides },
  };
}

function readStored(): StoredTheme {
  if (!DashboardConfig.allowUserTheming) return dashboardDefault();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return dashboardDefault();
    const parsed = JSON.parse(raw) as StoredTheme;
    if (!parsed?.presetId) return dashboardDefault();
    return { presetId: parsed.presetId, overrides: parsed.overrides ?? {} };
  } catch {
    return dashboardDefault();
  }
}

/** preset tokens + dashboard overrides + user overrides → final config. */
function resolve(stored: StoredTheme): ThemeConfig {
  const { id: _id, labelKey: _labelKey, ...presetTokens } = getPreset(stored.presetId);
  return { ...presetTokens, ...DashboardConfig.themeOverrides, ...stored.overrides };
}

export function BrandThemeProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredTheme>(readStored);

  const config = useMemo(() => resolve(stored), [stored]);

  useEffect(() => {
    applyTheme(config);
  }, [config]);

  useEffect(() => {
    if (DashboardConfig.allowUserTheming) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    }
  }, [stored]);

  // Switching preset intentionally clears personal overrides.
  const selectPreset = useCallback((presetId: string) => {
    setStored({ presetId, overrides: { ...DashboardConfig.themeOverrides } });
  }, []);

  const update = useCallback((patch: Partial<ThemeConfig>) => {
    setStored((prev) => ({ ...prev, overrides: { ...prev.overrides, ...patch } }));
  }, []);

  const reset = useCallback(() => setStored(dashboardDefault()), []);

  const value = useMemo<BrandThemeContextValue>(() => {
    const preset = getPreset(stored.presetId);
    const isCustomised = (Object.keys(stored.overrides) as Array<keyof ThemeConfig>).some(
      (key) => stored.overrides[key] !== undefined && stored.overrides[key] !== preset[key],
    );
    return {
      config,
      presets: THEME_PRESETS,
      activePresetId: stored.presetId,
      isCustomised,
      selectPreset,
      update,
      reset,
    };
  }, [config, stored, selectPreset, update, reset]);

  return <BrandThemeContext.Provider value={value}>{children}</BrandThemeContext.Provider>;
}

export function useBrandTheme(): BrandThemeContextValue {
  const ctx = useContext(BrandThemeContext);
  if (!ctx) throw new Error("useBrandTheme must be used within a BrandThemeProvider");
  return ctx;
}
