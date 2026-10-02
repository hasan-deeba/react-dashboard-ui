/**
 * User resource declarations.
 *
 * PURPOSE : single source of truth for the user form and detail view, so
 *           create, edit and show never drift apart.
 * EXPORTS : buildUserFields(model), buildUserShowSections(model).
 * EDIT    : labels come from the `users` locale namespace via
 *           `useModelTranslation("users")` — pass the model in, never
 *           hardcode a key here. Option labels arrive translated from
 *           Laravel; only map the item shape with `optionKeys`.
 */

import { Mail, User } from "lucide-react";
import { field, type FieldInput } from "@/components/form";
import type { ShowSection } from "@/components/show/DynamicShow";
import type { ModelTranslation } from "@/hooks/useModelTranslation";
import type { AuthUser } from "@/services/auth";

export function buildUserFields(m: ModelTranslation): FieldInput[] {
  return [
    field.image("image").label(m.field("image")),

    field
      .text("name")
      .label(m.field("name"))
      .placeholderKey("auth.fields.namePlaceholder")
      .icon(User)
      .required(),

    field
      .email("email")
      .label(m.field("email"))
      .placeholderKey("auth.fields.emailPlaceholder")
      .icon(Mail)
      .email()
      .required(),

    // Required on create; optional on edit (blank keeps the current one).
    field
      .password("password")
      .label(m.field("password"))
      .placeholderKey("auth.fields.passwordPlaceholder")
      .min(8)
      .required()
      .only("create"),

    field
      .password("password_confirmation")
      .label(m.field("passwordConfirm"))
      .placeholderKey("auth.fields.passwordPlaceholder")
      .matches("password")
      .required()
      .only("create"),

    field
      .password("password")
      .label(m.field("newPassword"))
      .placeholderKey("auth.fields.passwordPlaceholder")
      .hint(m.hint("password"))
      .min(8)
      .only("edit"),

    // GET users/builder → { roles: [{ id, name }, …] }; the id is submitted.
    field
      .multiselect("roles")
      .label(m.field("roles"))
      .builderKey("roles")
      .optionKeys({ value: "id", label: "name" })
      .placeholder(m.hint("roles"))
      .required()
      .width("full"),

    field
      .switch("is_active")
      .label(m.field("isActive"))
      .hint(m.hint("isActive"))
      .default(true),
  ];
}

export function buildUserShowSections(
  m: ModelTranslation,
): ShowSection<AuthUser & Record<string, unknown>>[] {
  return [
    {
      title: m.key("sections.account"),
      entries: [
        { key: "name", label: m.field("name") },
        { key: "email", label: m.field("email") },
        { key: "is_active", type: "boolean", label: m.field("isActive") },
        { key: "roles", type: "badges", label: m.field("roles") },
      ],
    },
  ];
}
