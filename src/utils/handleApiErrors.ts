import type { TFunction } from "i18next";

export interface ApiError {
  status?: number;
  data?: {
    errors?: Record<string, string | string[]>;
  };
}

export type FieldErrors = Record<string, string>;

export const parseFieldErrors = (
    err: ApiError,
    t?: TFunction
): FieldErrors | null => {
  if (err.status !== 422 || !err.data?.errors) return null;

  const fieldErrors: FieldErrors = {};

  Object.entries(err.data.errors).forEach(([key, msgs]) => {
    const msg = Array.isArray(msgs) ? (msgs[0] ?? "") : msgs;
    fieldErrors[key] =
        msg.includes(".") && t ? t(msg, { field: t(`fields:${key}`) }) : msg;
  });

  return fieldErrors;
};