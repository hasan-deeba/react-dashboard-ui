/**
 * GLOBAL multi-file upload input (`components/inputs`) — use anywhere.
 *
 * PURPOSE : one field for "attachments" of any shape — multiple images,
 *           a mix with saved server URLs, or plain documents (pdf/docx/…).
 *           Images render as thumbnail tiles (staged files via object URLs),
 *           everything else renders as a file row (icon + name + size).
 *           Extension/size checks (and dimension caps for images) run
 *           client-side; the caller owns what staging/removal means for
 *           its API and when uploads actually happen.
 * EXPORTS : FileUploadField.
 * EDIT    : keep item identity simple — staged files remove by index,
 *           existing URLs remove by index; callers map that to their state.
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FileText, Plus, X } from "lucide-react";
import { Spinner } from "@/components/ui/Loading";
import { useLanguage } from "@/context/LanguageContext";
import {
  describedBy,
  errorId,
  FieldError,
  FieldHint,
  FieldLabel,
  hintId,
} from "@/components/form/inputs/FieldChrome";
import {
  DEFAULT_IMAGE_ACCEPT,
  DEFAULT_MAX_DIMENSION,
  DEFAULT_MAX_KB,
  extensionOf,
  isImageExtension,
  probeDimensions,
  validateFileSync,
  type FileTypeIssue,
} from "@/components/form/inputs/uploadUtils";
import { cn } from "@/utils/cn";

export interface ExistingFile {
  url: string;
  name?: string;
}

export interface FileUploadFieldProps {
  id?: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Allow picking several files (default true). */
  multiple?: boolean;
  /** Allowed extensions without dots (default: image formats). */
  accept?: string[];
  maxKb?: number;
  maxDimension?: number;
  /** Files picked in the UI that the caller has not uploaded yet. */
  stagedFiles?: File[];
  /** Already-saved documents (URLs the server returned). */
  existing?: ExistingFile[];
  /** True while the caller's upload request is in flight. */
  uploading?: boolean;
  onStage: (files: File[]) => void;
  onRemoveStaged?: (index: number) => void;
  onRemoveExisting?: (index: number) => void;
  onError: (message: string | null) => void;
}

const formatKb = (bytes: number): string =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const nameFromUrl = (url: string): string => {
  try {
    return decodeURIComponent(url.split("?")[0].split("/").pop() ?? url);
  } catch {
    return url;
  }
};

export function FileUploadField({
  id,
  label,
  hint,
  error,
  required = false,
  disabled,
  multiple = true,
  accept,
  maxKb = DEFAULT_MAX_KB,
  maxDimension = DEFAULT_MAX_DIMENSION,
  stagedFiles = [],
  existing = [],
  uploading = false,
  onStage,
  onRemoveStaged,
  onRemoveExisting,
  onError,
}: FileUploadFieldProps) {
  const { t } = useLanguage();
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [checking, setChecking] = useState(false);
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());

  const acceptList = (accept?.length ? accept : DEFAULT_IMAGE_ACCEPT).map((ext) =>
    ext.toLowerCase(),
  );
  const described = describedBy(
    error ? errorId(fieldId) : undefined,
    hint ? hintId(fieldId) : undefined,
  );

  // Object URLs for staged image previews, revoked on change/unmount.
  const stagedPreviews = useMemo(
    () =>
      stagedFiles.map((file) =>
        isImageExtension(extensionOf(file.name)) ? URL.createObjectURL(file) : null,
      ),
    [stagedFiles],
  );
  useEffect(
    () => () => {
      for (const url of stagedPreviews) if (url) URL.revokeObjectURL(url);
    },
    [stagedPreviews],
  );

  const reportIssue = (issue: FileTypeIssue) => onError(t(issue.key, issue.params));

  const pick = async (files: File[]) => {
    onError(null);
    for (const file of files) {
      const issue = validateFileSync(file, acceptList, maxKb);
      if (issue) {
        reportIssue(issue);
        return;
      }
      if (isImageExtension(extensionOf(file.name))) {
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
      }
    }
    onStage(files);
  };

  const tileClass =
    "relative size-20 overflow-hidden rounded-icon bg-slate-100 ring-1 ring-slate-200/80 dark:bg-slate-800 dark:ring-slate-700/70";
  const removeButtonClass = cn(
    "absolute end-1 top-1 grid size-5 place-items-center rounded-full bg-slate-950/60 text-white",
    "transition-colors hover:bg-rose-500",
  );

  return (
    <div className="space-y-1.5">
      {label && (
        <FieldLabel htmlFor={fieldId} required={required}>
          {label}
        </FieldLabel>
      )}

      <div className="flex flex-wrap items-start gap-2.5">
        {existing.map((item, index) => {
          const isImage = isImageExtension(extensionOf(item.url).split("?")[0]);
          const failed = broken.has(item.url);
          return (
            <div key={item.url} className={cn(tileClass, (!isImage || failed) && "grid place-items-center gap-0.5 p-1.5 text-center")}>
              {isImage && !failed ? (
                <img
                  src={item.url}
                  alt={item.name ?? nameFromUrl(item.url)}
                  onError={() => setBroken((prev) => new Set(prev).add(item.url))}
                  className="size-full object-cover"
                />
              ) : (
                <>
                  <FileText className="size-6 text-slate-400" />
                  <span className="w-full truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {item.name ?? nameFromUrl(item.url)}
                  </span>
                </>
              )}
              {onRemoveExisting && !disabled && !uploading && (
                <button
                  type="button"
                  aria-label={t("inputs.upload.remove")}
                  onClick={() => onRemoveExisting(index)}
                  className={removeButtonClass}
                >
                  <X className="size-3" />
                </button>
              )}
            </div>
          );
        })}

        {stagedFiles.map((file, index) => {
          const preview = stagedPreviews[index];
          return (
            <div key={`${file.name}-${index}`} className={cn(tileClass, !preview && "grid place-items-center gap-0.5 p-1.5 text-center")}>
              {preview ? (
                <img src={preview} alt={file.name} className="size-full object-cover" />
              ) : (
                <>
                  <FileText className="size-6 text-slate-400" />
                  <span className="w-full truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    {file.name}
                  </span>
                  <span className="text-[9px] text-slate-400">{formatKb(file.size)}</span>
                </>
              )}
              {onRemoveStaged && !disabled && !uploading && (
                <button
                  type="button"
                  aria-label={t("inputs.upload.remove")}
                  onClick={() => onRemoveStaged(index)}
                  className={removeButtonClass}
                >
                  <X className="size-3" />
                </button>
              )}
              {uploading && (
                <div className="absolute inset-0 grid place-items-center bg-slate-950/40">
                  <Spinner size="xs" onBrand />
                </div>
              )}
            </div>
          );
        })}

        <button
          id={fieldId}
          type="button"
          disabled={disabled || checking || uploading}
          onClick={() => inputRef.current?.click()}
          aria-describedby={described}
          aria-invalid={Boolean(error)}
          className={cn(
            "grid size-20 place-items-center gap-1 rounded-icon border border-dashed border-slate-300",
            "text-slate-400 transition-colors hover:border-brand-400 hover:text-brand-500",
            "disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:text-slate-500",
          )}
        >
          {checking ? <Spinner size="sm" /> : <Plus className="size-5" />}
          <span className="px-1 text-center text-[10px] font-semibold leading-tight">
            {t("inputs.upload.addFiles")}
          </span>
        </button>
      </div>

      {error ? (
        <FieldError id={errorId(fieldId)} message={error} />
      ) : (
        <FieldHint id={hintId(fieldId)}>{hint}</FieldHint>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept={acceptList.map((ext) => `.${ext}`).join(",")}
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = ""; // re-picking the same file must re-fire
          if (files.length > 0) void pick(multiple ? files : files.slice(0, 1));
        }}
      />
    </div>
  );
}
