/**
 * IMAGE settings widget.
 *
 * PURPOSE : thumbnail preview of the stored URL (or the staged File),
 *           upload/replace, remove with confirmation, and client-side
 *           type/size/dimension checks so a bad file never becomes a request.
 *           While the owning section saves, a pending overlay marks the
 *           staged file as uploading.
 * EXPORTS : ImageSetting.
 * EDIT    : never post the stored URL back — this widget only ever stages a
 *           File, a removal, or nothing (see `settingsState.ts`). If a saved
 *           image 404s it is a storage:link deployment issue; show the broken
 *           state, don't rewrite the URL.
 */

import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Undo2, Upload } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Spinner } from "@/components/ui/Loading";
import type { SettingsFieldMeta } from "@/types/settings";
import { fieldDomId, type ImageDraft } from "@/views/settings/settingsState";
import { errorId, FieldError, FieldHint, FieldLabel, hintId } from "@/views/settings/components/chrome";
import { cn } from "@/utils/cn";

const DEFAULT_ACCEPT = ["jpg", "jpeg", "png", "webp"];
const DEFAULT_MAX_KB = 4096;
const MAX_DIMENSION = 4096;

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

/** Decode the image to enforce the dimension cap; rejects unreadable files. */
function probeDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
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
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [checking, setChecking] = useState(false);

  const id = fieldDomId(field.key);
  const accept = (field.accept?.length ? field.accept : DEFAULT_ACCEPT).map((ext) =>
    ext.toLowerCase(),
  );
  const maxKb = field.max_kilobytes ?? DEFAULT_MAX_KB;

  const stagedFile = draft.stage.status === "staged" ? draft.stage.file : null;
  const removed = draft.stage.status === "removed";

  // Object URL lifecycle for the staged file (never leak it).
  useEffect(() => {
    if (!stagedFile) {
      setStagedPreview(null);
      return;
    }
    const url = URL.createObjectURL(stagedFile);
    setStagedPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [stagedFile]);

  // A new server URL may be reachable again — retry rendering it.
  useEffect(() => setBroken(false), [currentUrl]);

  const preview = stagedPreview ?? (removed ? null : currentUrl);
  const showImage = Boolean(preview) && !broken;
  const hasCurrent = Boolean(currentUrl) || stagedFile !== null;

  const hint = [
    t("settings.hints.image", { formats: accept.join(", "), max: maxKb }),
    extraHint,
  ]
    .filter(Boolean)
    .join(" ");

  const pick = async (file: File) => {
    onError(null);

    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!accept.includes(extension)) {
      onError(t("settings.validation.imageType", { formats: accept.join(", ") }));
      return;
    }
    if (file.size > maxKb * 1024) {
      onError(t("settings.validation.imageSize", { max: maxKb }));
      return;
    }

    setChecking(true);
    try {
      const { width, height } = await probeDimensions(file);
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        onError(t("settings.validation.imageDimensions", { max: MAX_DIMENSION }));
        return;
      }
    } catch {
      onError(t("settings.validation.imageUnreadable"));
      return;
    } finally {
      setChecking(false);
    }
    onStage(file);
  };

  return (
    <div className="space-y-1.5">
      <FieldLabel>{field.label}</FieldLabel>

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {showImage ? (
            <img
              src={preview ?? undefined}
              alt={field.label}
              onError={() => setBroken(true)}
              className={cn(
                "size-20 rounded-icon bg-slate-100 object-cover ring-4 ring-brand-500/20 dark:bg-slate-800",
                removed && "opacity-40 grayscale",
              )}
            />
          ) : (
            <div className="grid size-20 place-items-center rounded-icon bg-slate-100 text-slate-400 ring-4 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60">
              <Camera className="size-6" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 grid place-items-center rounded-icon bg-slate-950/40">
              <Spinner size="sm" onBrand />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              id={id}
              type="button"
              disabled={disabled || checking || uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 rounded-control border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {checking ? <Spinner size="xs" /> : <Upload className="size-3.5" />}
              {t(hasCurrent && !removed ? "settings.actions.replace" : "settings.actions.upload")}
            </button>

            {hasCurrent && !removed && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={() => setConfirming(true)}
                aria-label={t("settings.actions.remove")}
                className={cn(
                  "grid size-8 place-items-center rounded-control border border-slate-200 text-slate-400",
                  "transition-colors hover:bg-rose-500/10 hover:text-rose-500 disabled:opacity-60 dark:border-slate-700",
                )}
              >
                <Trash2 className="size-3.5" />
              </button>
            )}

            {removed && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={onUndo}
                className="flex items-center gap-1.5 rounded-control border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Undo2 className="size-3.5" />
                {t("settings.actions.undo")}
              </button>
            )}

            {uploading && (
              <span className="text-xs font-medium text-slate-400">{t("settings.status.uploading")}</span>
            )}
          </div>

          {error ? (
            <div className="mt-1.5">
              <FieldError id={errorId(id)} message={error} />
            </div>
          ) : (
            <div className="mt-1.5">
              <FieldHint id={hintId(id)}>{hint}</FieldHint>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={accept.map((ext) => `.${ext}`).join(",")}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = ""; // re-picking the same file must re-fire
            if (file) void pick(file);
          }}
        />
      </div>

      <ConfirmModal
        open={confirming}
        title={t("settings.dialogs.removeImage.title")}
        description={t("settings.dialogs.removeImage.body")}
        confirmLabel={t("settings.dialogs.removeImage.confirm")}
        tone="danger"
        onConfirm={() => {
          setConfirming(false);
          onRemove();
        }}
        onCancel={() => setConfirming(false)}
      />
    </div>
  );
}
