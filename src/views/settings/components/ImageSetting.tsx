/**
 * IMAGE settings widget — thin adapter over the global ImageUploadField.
 *
 * PURPOSE : maps builder meta (accept, max_kilobytes, label) + the settings
 *           draft staging model (staged File / removal / undo) onto the
 *           shared `ImageUploadField` input (`components/inputs`), with the
 *           settings-specific hint composition and remove confirmation.
 * EXPORTS : ImageSetting.
 * EDIT    : upload/preview/validation behaviour lives in components/inputs
 *           — change it there and every section benefits the same way.
 */

import { useLanguage } from "@/context/LanguageContext";
import type { SettingsFieldMeta } from "@/types/settings";
import { ImageUploadField } from "@/components/inputs";
import { fieldDomId, type ImageDraft } from "@/views/settings/settingsState";

interface ImageSettingProps {
  field: SettingsFieldMeta;
  draft: ImageDraft;
  /** Absolute URL the last GET returned (display only). */
  currentUrl: string | null;
  extraHint?: string;
  error?: string;
  disabled?: boolean;
  /** True while the section request with this staged file is in flight. */
  uploading?: boolean;
  onStage: (file: File) => void;
  onRemove: () => void;
  onUndo: () => void;
  onError: (message: string | null) => void;
}

export function ImageSetting({
  field,
  draft,
  currentUrl,
  extraHint,
  error,
  disabled,
  uploading = false,
  onStage,
  onRemove,
  onUndo,
  onError,
}: ImageSettingProps) {
  const { t } = useLanguage();
  const maxKb = field.max_kilobytes ?? 4096;
  const accept = field.accept?.length ? field.accept : undefined;

  const hint = [
    t("settings.hints.image", { formats: (accept ?? ["jpg", "jpeg", "png", "webp"]).join(", "), max: maxKb }),
    extraHint,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <ImageUploadField
      id={fieldDomId(field.key)}
      label={field.label}
      hint={hint}
      error={error}
      disabled={disabled}
      uploading={uploading}
      valueUrl={currentUrl}
      stagedFile={draft.stage.status === "staged" ? draft.stage.file : null}
      removed={draft.stage.status === "removed"}
      accept={accept}
      maxKb={maxKb}
      onStage={onStage}
      onRemove={onRemove}
      onUndo={onUndo}
      onError={onError}
      confirmRemove={{
        title: t("settings.dialogs.removeImage.title"),
        description: t("settings.dialogs.removeImage.body"),
      }}
    />
  );
}
