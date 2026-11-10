/**
 * GLOBAL single-image upload input (`components/inputs`) — use anywhere.
 *
 * PURPOSE : thumbnail of the stored URL (or the staged File), upload /
 *           replace, remove (optionally behind a confirmation dialog), undo,
 *           and client-side type/size/dimension checks so a bad file never
 *           becomes a request. While `uploading` is set, a pending overlay
 *           marks the staged file as in flight.
 * EXPORTS : ImageUploadField.
 * EDIT    : this component never decides wire format — callers own what a
 *           staged File or a removal means for their API. If a saved image
 *           404s it is a backend storage issue; the broken state shows the
 *           attempted URL on hover and retries on click — never rewrite it.
 */

import { useEffect, useId, useRef, useState } from "react";
import { Camera, Trash2, Undo2, Upload } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { Spinner } from "@/components/ui/Loading";
import {
  describedBy,
  errorId,
  FieldError,
  FieldHint,
  FieldLabel,
  hintId,
} from "@/components/form/inputs/FieldFrame";
import {
  DEFAULT_IMAGE_ACCEPT,
  DEFAULT_MAX_DIMENSION,
  DEFAULT_MAX_KB,
  probeDimensions,
  validateFileSync,
  type FileTypeIssue,
} from "@/components/form/inputs/uploadUtils";
import { cn } from "@/utils/cn";

export interface ImageUploadFieldProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** True while the staged file's upload request is in flight. */
  uploading?: boolean;
  /** Display-ready URL the server returned (display only). */
  valueUrl?: string | null;
  /** Newly picked file, not yet uploaded. */
  stagedFile?: File | null;
  /** Staged removal (greyed thumbnail + undo). */
  removed?: boolean;
  accept?: string[];
  maxKb?: number;
  maxDimension?: number;
  onStage: (file: File) => void;
  onRemove: () => void;
  onUndo: () => void;
  onError: (message: string | null) => void;
  /** When provided, "remove" asks first via the shared ConfirmModal. */
  confirmRemove?: {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
  };
}

export function ImageUploadField({
  id,
  label,
  hint,
  error,
  required = false,
  disabled,
  uploading = false,
  valueUrl = null,
  stagedFile = null,
  removed = false,
  accept,
  maxKb = DEFAULT_MAX_KB,
  maxDimension = DEFAULT_MAX_DIMENSION,
  onStage,
  onRemove,
  onUndo,
  onError,
  confirmRemove,
}: ImageUploadFieldProps) {
  const { t } = useLanguage();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [stagedPreview, setStagedPreview] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [checking, setChecking] = useState(false);

  const acceptList = (accept?.length ? accept : DEFAULT_IMAGE_ACCEPT).map((ext) =>
    ext.toLowerCase(),
  );

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
  useEffect(() => setBroken(false), [valueUrl]);

  const preview = stagedPreview ?? (removed ? null : valueUrl);
  const showImage = Boolean(preview) && !broken;
  const hasCurrent = Boolean(valueUrl) || stagedFile !== null;
  const described = describedBy(
    error ? errorId(fieldId) : undefined,
    hint ? hintId(fieldId) : undefined,
  );

  const reportIssue = (issue: FileTypeIssue) => onError(t(issue.key, issue.params));

  const pick = async (file: File) => {
    onError(null);

    const issue = validateFileSync(file, acceptList, maxKb);
    if (issue) {
      reportIssue(issue);
      return;
    }

    setChecking(true);
    try {
      const { width, height } = await probeDimensions(file);
      if (width > maxDimension || height > maxDimension) {
        reportIssue({ key: "inputs.validation.imageDimensions", params: { max: maxDimension } });
        return;
      }
    } catch {
      reportIssue({ key: "inputs.validation.fileUnreadable" });
      return;
    } finally {
      setChecking(false);
    }
    onStage(file);
  };

  const requestRemove = () => {
    if (confirmRemove) setConfirming(true);
    else onRemove();
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <FieldLabel htmlFor={fieldId} required={required}>
          {label}
        </FieldLabel>
      )}

      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {showImage ? (
            <img
              src={preview ?? undefined}
              alt={label ?? ""}
              onError={() => setBroken(true)}
              className={cn(
                "size-20 rounded-icon bg-slate-100 object-cover ring-4 ring-brand-500/20 dark:bg-slate-800",
                removed && "opacity-40 grayscale",
              )}
            />
          ) : (
            // Broken state stays inspectable: tooltip carries the attempted
            // URL, and clicking retries the load (server may just be back).
            <div
              role={broken && valueUrl ? "button" : undefined}
              tabIndex={broken && valueUrl ? 0 : undefined}
              title={broken && valueUrl ? valueUrl : undefined}
              onClick={() => broken && setBroken(false)}
              onKeyDown={(event) => {
                if (broken && (event.key === "Enter" || event.key === " ")) setBroken(false);
              }}
              className={cn(
                "grid size-20 place-items-center rounded-icon bg-slate-100 text-slate-400 ring-4 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60",
                broken && valueUrl && "cursor-pointer ring-rose-300/70 hover:text-rose-500 dark:ring-rose-500/40",
              )}
            >
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
              id={fieldId}
              type="button"
              disabled={disabled || checking || uploading}
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 rounded-control border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {checking ? <Spinner size="xs" /> : <Upload className="size-3.5" />}
              {t(hasCurrent && !removed ? "inputs.upload.replace" : "inputs.upload.upload")}
            </button>

            {hasCurrent && !removed && (
              <button
                type="button"
                disabled={disabled || uploading}
                onClick={requestRemove}
                aria-label={t("inputs.upload.remove")}
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
                {t("inputs.upload.undo")}
              </button>
            )}

            {uploading && (
              <span className="text-xs font-medium text-slate-400">{t("inputs.upload.uploading")}</span>
            )}
          </div>

          {error ? (
            <div className="mt-1.5">
              <FieldError id={errorId(fieldId)} message={error} />
            </div>
          ) : (
            <div className="mt-1.5">
              <FieldHint id={hintId(fieldId)}>{hint}</FieldHint>
            </div>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={acceptList.map((ext) => `.${ext}`).join(",")}
          aria-describedby={described}
          aria-invalid={Boolean(error)}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = ""; // re-picking the same file must re-fire
            if (file) void pick(file);
          }}
        />
      </div>

      {confirmRemove && (
        <ConfirmModal
          open={confirming}
          title={confirmRemove.title}
          description={confirmRemove.description}
          confirmLabel={confirmRemove.confirmLabel}
          cancelLabel={confirmRemove.cancelLabel}
          tone="danger"
          onCancel={() => setConfirming(false)}
          onConfirm={() => {
            setConfirming(false);
            onRemove();
          }}
        />
      )}
    </div>
  );
}
