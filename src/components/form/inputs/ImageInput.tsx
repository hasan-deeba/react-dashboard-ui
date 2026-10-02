import { useEffect, useRef, useState } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { cn } from "@/utils/cn";

interface ImageInputProps {
  /** Existing URL (string) or a freshly picked File. */
  value: string | File | null | undefined;
  onChange: (value: File | string | null) => void;
  disabled?: boolean;
}

/** Avatar-style image picker with preview and remove. */
export function ImageInput({ value, onChange, disabled }: ImageInputProps) {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreview(typeof value === "string" && value ? value : null);
  }, [value]);

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        {preview ? (
          <img
            src={preview}
            alt=""
            className="size-20 rounded-full object-cover ring-4 ring-brand-500/20"
          />
        ) : (
          <div className="grid size-20 place-items-center rounded-full bg-slate-100 text-slate-400 ring-4 ring-slate-200/60 dark:bg-slate-800 dark:ring-slate-700/60">
            <Camera className="size-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 rounded-control border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Upload className="size-3.5" />
            {t("form.uploadImage")}
          </button>
          {preview && (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                onChange(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className={cn(
                "grid size-8 place-items-center rounded-control border border-slate-200 text-slate-400",
                "transition-colors hover:bg-rose-500/10 hover:text-rose-500 dark:border-slate-700",
              )}
              aria-label={t("form.removeImage")}
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">{t("form.imageHint")}</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
      />
    </div>
  );
}
