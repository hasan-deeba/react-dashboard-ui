/**
 * Shared client-side file checks for the global upload inputs.
 *
 * PURPOSE : extension allow-lists, size caps, image probing — one
 *           implementation so `ImageUploadField` and `FileUploadField`
 *           (and any future uploader) reject bad files identically,
 *           BEFORE they ever become a request.
 * EXPORTS : IMAGE_EXTENSIONS, DEFAULT_IMAGE_ACCEPT, DEFAULT_MAX_KB,
 *           DEFAULT_MAX_DIMENSION, extensionOf(), isImageExtension(),
 *           probeDimensions(), FileTypeIssue.
 * EDIT    : issues carry locale KEYS (inputs.validation.*) — the calling
 *           component translates; this module stays UI-free.
 */

export const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "gif", "svg", "bmp", "avif"];
export const DEFAULT_IMAGE_ACCEPT = ["jpg", "jpeg", "png", "webp"];
export const DEFAULT_MAX_KB = 4096;
export const DEFAULT_MAX_DIMENSION = 4096;

export const extensionOf = (name: string): string =>
  name.split(".").pop()?.toLowerCase() ?? "";

export const isImageExtension = (extension: string): boolean =>
  IMAGE_EXTENSIONS.includes(extension);

/** Locale key + interpolation params describing why a file was rejected. */
export interface FileTypeIssue {
  key: "inputs.validation.fileType" | "inputs.validation.fileSize" | "inputs.validation.imageDimensions" | "inputs.validation.fileUnreadable";
  params?: Record<string, string | number>;
}

/** Decode an image to enforce the dimension cap; rejects unreadable files. */
export function probeDimensions(file: File): Promise<{ width: number; height: number }> {
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

/**
 * Sync checks (extension + size). Image dimensions are async — callers run
 * probeDimensions afterwards when extensionOf() is an image extension.
 */
export function validateFileSync(
  file: File,
  accept: string[],
  maxKb: number,
): FileTypeIssue | null {
  const extension = extensionOf(file.name);
  if (!accept.includes(extension)) {
    return { key: "inputs.validation.fileType", params: { formats: accept.join(", ") } };
  }
  if (file.size > maxKb * 1024) {
    return { key: "inputs.validation.fileSize", params: { max: maxKb } };
  }
  return null;
}
