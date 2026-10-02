/**
 * Settings form declarations.
 *
 * PURPOSE : the fields of the singleton `settings` resource.
 * EXPORTS : buildSettingsFields(model).
 * EDIT    : field `name`s must match the keys your API accepts on
 *           `POST settings`. Adding a setting = one builder line + one label
 *           in `src/locales/{en,ar}/settings.json`.
 */

import { AtSign, Phone } from "lucide-react";
import { field, type FieldInput } from "@/components/form";
import type { ModelTranslation } from "@/hooks/useModelTranslation";

export function buildSettingsFields(m: ModelTranslation): FieldInput[] {
  return [
    field.email("support_email").label(m.field("supportEmail")).icon(AtSign).email(),
    field.text("support_phone").label(m.field("supportPhone")).icon(Phone),
    field.image("logo").label(m.field("logo")),

    field.textarea("address").label(m.field("address")).width("full"),

    field
      .switch("maintenance_mode")
      .label(m.field("maintenanceMode"))
      .hint(m.hint("maintenanceMode"))
      .default(false),

    field
      .switch("allow_registration")
      .label(m.field("allowRegistration"))
      .hint(m.hint("allowRegistration"))
      .default(true),
  ];
}
