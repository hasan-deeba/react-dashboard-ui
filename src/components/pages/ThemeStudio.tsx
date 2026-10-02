import { motion } from "framer-motion";
import { Check, Lock, Paintbrush, RotateCcw, Sparkles } from "lucide-react";
import { DashboardConfig } from "@/config/DashboardConfig";
import { useBrandTheme } from "@/context/BrandThemeContext";
import { useLanguage } from "@/context/LanguageContext";
import { BRAND_SWATCHES } from "@/theme/presets";
import type {
  Density,
  HeaderVariant,
  IconShape,
  RadiusScale,
  SidebarVariant,
  SurfaceStyle,
} from "@/theme/types";
import { LayoutPreview } from "@/components/theme/LayoutPreview";
import { Segmented, StudioSection } from "@/components/theme/StudioControls";
import { cn } from "@/utils/cn";

const ICON_PREVIEW_RADIUS: Record<IconShape, string> = {
  rounded: "0.55rem",
  circle: "9999px",
  squircle: "0.85rem",
  sharp: "0.125rem",
};

const RADIUS_PREVIEW: Record<RadiusScale, string> = {
  sharp: "0.15rem",
  soft: "0.45rem",
  rounded: "0.7rem",
  pill: "1.1rem",
};

export function ThemeStudio() {
  const { t } = useLanguage();
  const { config, presets, activePresetId, isCustomised, selectPreset, update, reset } =
    useBrandTheme();

  if (!DashboardConfig.allowUserTheming) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="surface-card max-w-sm p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-icon bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Lock className="size-6" />
          </span>
          <h1 className="mt-4 font-display text-xl font-bold text-slate-900 dark:text-white">
            {t("theme.title")}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("theme.subtitle")}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-[var(--gap-grid)]"
    >
      {/* Page header */}
      <div className="surface-card flex flex-wrap items-center justify-between gap-4 p-[var(--pad-card)]">
        <div className="flex items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-icon bg-gradient-to-br from-brand-500 to-accent-500 text-white shadow-lg">
            <Paintbrush className="size-5" />
          </span>
          <div>
            <h1 className="flex items-center gap-2 font-display text-xl font-bold text-slate-900 dark:text-white">
              {t("theme.title")}
              {isCustomised && (
                <span className="rounded-full bg-brand-500/10 px-2 py-0.5 text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                  {t("theme.customised")}
                </span>
              )}
            </h1>
            <p className="mt-0.5 max-w-xl text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              {t("theme.subtitle")}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-control border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RotateCcw className="size-3.5" />
          {t("theme.reset")}
        </button>
      </div>

      {/* Presets */}
      <StudioSection title={t("theme.presets.title")} description={t("theme.presets.description")}>
        <div className="grid gap-3 sm:grid-cols-3">
          {presets.map((preset) => {
            const active = preset.id === activePresetId;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                className={cn(
                  "group relative rounded-control border p-3 text-start transition-all",
                  active
                    ? "border-brand-500 ring-2 ring-brand-500/25"
                    : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600",
                )}
              >
                {active && (
                  <span className="absolute end-2 top-2 grid size-5 place-items-center rounded-full bg-brand-600 text-white">
                    <Check className="size-3" />
                  </span>
                )}
                <LayoutPreview sidebar={preset.sidebar} header={preset.header} active={active} />
                <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-white">
                  <span
                    className="size-3 rounded-full ring-2 ring-white dark:ring-slate-900"
                    style={{ background: preset.brandColor }}
                  />
                  {t(`theme.presets.${preset.labelKey}.name`)}
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                  {t(`theme.presets.${preset.labelKey}.description`)}
                </p>
              </button>
            );
          })}
        </div>
      </StudioSection>

      <div className="grid gap-[var(--gap-grid)] lg:grid-cols-2">
        {/* Brand colour */}
        <StudioSection title={t("theme.brand.title")} description={t("theme.brand.description")}>
          <div className="grid grid-cols-6 gap-2">
            {BRAND_SWATCHES.map((color) => {
              const active = color.toLowerCase() === config.brandColor.toLowerCase();
              return (
                <button
                  key={color}
                  type="button"
                  aria-label={color}
                  onClick={() => update({ brandColor: color })}
                  style={{ background: color }}
                  className={cn(
                    "grid aspect-square w-full place-items-center rounded-icon transition-transform hover:scale-105",
                    active && "ring-2 ring-slate-900 ring-offset-2 dark:ring-white dark:ring-offset-slate-900",
                  )}
                >
                  {active && <Check className="size-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="flex items-center gap-3 rounded-control border border-slate-200 p-2.5 dark:border-slate-700">
              <input
                type="color"
                value={config.brandColor}
                onChange={(e) => update({ brandColor: e.target.value })}
                className="size-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t("theme.brand.custom")}
                </span>
                <span dir="ltr" className="block font-mono text-[11px] uppercase text-slate-400">
                  {config.brandColor}
                </span>
              </span>
            </label>

            <label className="flex items-center gap-3 rounded-control border border-slate-200 p-2.5 dark:border-slate-700">
              <input
                type="color"
                value={config.accentColor}
                onChange={(e) => update({ accentColor: e.target.value })}
                className="size-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
              />
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-slate-700 dark:text-slate-200">
                  {t("theme.brand.accent")}
                </span>
                <span dir="ltr" className="block font-mono text-[11px] uppercase text-slate-400">
                  {config.accentColor}
                </span>
              </span>
            </label>
          </div>
        </StudioSection>

        {/* Icon shape */}
        <StudioSection title={t("theme.icons.title")} description={t("theme.icons.description")}>
          <Segmented<IconShape>
            columns={4}
            value={config.iconShape}
            onChange={(iconShape) => update({ iconShape })}
            options={(["rounded", "circle", "squircle", "sharp"] as IconShape[]).map((shape) => ({
              value: shape,
              label: t(`theme.icons.${shape}`),
              preview: (
                <span
                  className="grid size-8 place-items-center bg-gradient-to-br from-brand-500 to-accent-500 text-white"
                  style={{ borderRadius: ICON_PREVIEW_RADIUS[shape] }}
                >
                  <Sparkles className="size-3.5" />
                </span>
              ),
            }))}
          />
        </StudioSection>

        {/* Corner style */}
        <StudioSection title={t("theme.shape.title")} description={t("theme.shape.description")}>
          <Segmented<RadiusScale>
            columns={4}
            value={config.radius}
            onChange={(radius) => update({ radius })}
            options={(["sharp", "soft", "rounded", "pill"] as RadiusScale[]).map((scale) => ({
              value: scale,
              label: t(`theme.shape.${scale}`),
              preview: (
                <span
                  className="block h-8 w-full border-2 border-brand-500/60 bg-brand-500/10"
                  style={{ borderRadius: RADIUS_PREVIEW[scale] }}
                />
              ),
            }))}
          />
        </StudioSection>

        {/* Surface + density */}
        <StudioSection title={t("theme.surface.title")}>
          <Segmented<SurfaceStyle>
            columns={3}
            value={config.surface}
            onChange={(surface) => update({ surface })}
            options={(["glass", "solid", "soft"] as SurfaceStyle[]).map((surface) => ({
              value: surface,
              label: t(`theme.surface.${surface}`),
            }))}
          />
          <h3 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t("theme.density.title")}
          </h3>
          <Segmented<Density>
            columns={2}
            value={config.density}
            onChange={(density) => update({ density })}
            options={(["comfortable", "compact"] as Density[]).map((density) => ({
              value: density,
              label: t(`theme.density.${density}`),
            }))}
          />
        </StudioSection>
      </div>

      {/* Layout */}
      <StudioSection title={t("theme.layout.title")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("theme.layout.sidebar")}
            </h3>
            <Segmented<SidebarVariant>
              columns={3}
              value={config.sidebar}
              onChange={(sidebar) => update({ sidebar })}
              options={(["classic", "floating", "rail"] as SidebarVariant[]).map((variant) => ({
                value: variant,
                label: t(`theme.layout.${variant}`),
                preview: (
                  <LayoutPreview
                    sidebar={variant}
                    header={config.header}
                    active={config.sidebar === variant}
                  />
                ),
              }))}
            />
          </div>

          <div>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t("theme.layout.header")}
            </h3>
            <Segmented<HeaderVariant>
              columns={3}
              value={config.header}
              onChange={(header) => update({ header })}
              options={(["standard", "minimal", "split"] as HeaderVariant[]).map((variant) => ({
                value: variant,
                label: t(`theme.layout.${variant}`),
                preview: (
                  <LayoutPreview
                    sidebar={config.sidebar}
                    header={variant}
                    active={config.header === variant}
                  />
                ),
              }))}
            />
          </div>
        </div>
      </StudioSection>
    </motion.div>
  );
}
