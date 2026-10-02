/**
 * Per-model translation helper.
 *
 * PURPOSE : every resource owns ONE locale namespace — the file
 *           `<model>.json` inside each locale folder — holding its
 *           `singular`, `plural`, field labels and action labels.
 *           Page titles are composed from the generic `general.crud.*`
 *           patterns, so "Create user" / "Edit role" are written once.
 * EXPORTS : useModelTranslation(namespace) → ModelTranslation.
 * EDIT    : the namespace IS the locale filename AND the URL segment
 *           (`users` → `src/locales/en/users.json` → `/users`). Keeping the
 *           three aligned is what lets the sidebar and breadcrumbs resolve
 *           labels without extra config.
 *
 *   const m = useModelTranslation("users");
 *   m.plural            → "Users"
 *   m.createTitle       → "Create User"
 *   m.field("email")    → "Email address"
 *   m.action("delete")  → "Delete"
 */

import { useMemo } from "react";
import { useLanguage } from "@/context/LanguageContext";

export interface ModelTranslation {
  /** Raw translator, for keys outside this model. */
  t: (key: string, params?: Record<string, string | number>) => string;
  exists: (key: string) => boolean;
  namespace: string;

  singular: string;
  plural: string;
  description: string;

  /** `<namespace>.fields.<name>` */
  field: (name: string) => string;
  /** `<namespace>.hints.<name>` — empty string when undefined. */
  hint: (name: string) => string;
  /** `<namespace>.actions.<name>`, falling back to `general.crud.<name>`. */
  action: (name: string) => string;
  /** Any key inside this model's namespace. */
  key: (path: string, params?: Record<string, string | number>) => string;

  /* Composed titles (general.crud.* + model name) */
  listTitle: string;
  createLabel: string;
  createTitle: string;
  createDescription: string;
  editTitle: string;
  editDescription: string;
  deleteTitle: string;
  deleteDescription: string;
  bulkDeleteTitle: (count: number) => string;
  emptyTitle: string;
  emptyBody: string;
  createdMessage: string;
  updatedMessage: string;
  deletedMessage: string;
  deleteFailedMessage: string;
}

export function useModelTranslation(namespace: string): ModelTranslation {
  const { t, exists } = useLanguage();

  return useMemo(() => {
    const singular = t(`${namespace}.singular`);
    const plural = t(`${namespace}.plural`);

    /** Model key when it exists, otherwise the provided fallback. */
    const own = (path: string, fallback: string): string => {
      const key = `${namespace}.${path}`;
      return exists(key) ? t(key) : fallback;
    };

    return {
      t,
      exists,
      namespace,
      singular,
      plural,
      description: own("description", ""),

      field: (name) => own(`fields.${name}`, name),
      hint: (name) => own(`hints.${name}`, ""),
      action: (name) => own(`actions.${name}`, t(`general.crud.${name}`, { model: singular })),
      key: (path, params) => t(`${namespace}.${path}`, params),

      listTitle: plural,
      createLabel: t("general.crud.create", { model: singular }),
      createTitle: t("general.crud.createTitle", { model: singular }),
      createDescription: t("general.crud.createDescription", { model: singular }),
      editTitle: t("general.crud.editTitle", { model: singular }),
      editDescription: t("general.crud.editDescription", { model: singular }),
      deleteTitle: t("general.crud.deleteTitle", { model: singular }),
      deleteDescription: t("general.crud.deleteDescription"),
      bulkDeleteTitle: (count) =>
        t("general.crud.bulkDeleteTitle", { count, model: plural }),
      emptyTitle: own("empty", t("general.crud.empty", { model: plural })),
      emptyBody: own("emptyBody", t("general.crud.emptyBody")),
      createdMessage: t("general.crud.created", { model: singular }),
      updatedMessage: t("general.crud.updated", { model: singular }),
      deletedMessage: t("general.crud.deleted", { model: singular }),
      deleteFailedMessage: t("general.crud.deleteFailed", { model: singular }),
    };
  }, [namespace, t, exists]);
}
