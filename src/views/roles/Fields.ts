/**
 * Role resource declarations.
 *
 * PURPOSE : fields for the role form (name + permission matrix).
 * EXPORTS : buildRoleFields(model).
 * EDIT    : `GET roles/builder` returns
 *             { data: [...], grouped: [{ group, permissions: [{id,name}] }] }
 *           The grouped-checkbox reads `grouped` and submits permission IDs —
 *           `optionKeys` is what guarantees ids (never names) are sent.
 */

import { ShieldCheck } from "lucide-react";
import { field, type FieldInput } from "@/components/form";
import type { ModelTranslation } from "@/hooks/useModelTranslation";

export function buildRoleFields(m: ModelTranslation): FieldInput[] {
  return [
    field
      .text("name")
      .label(m.field("name"))
      .placeholder(m.hint("name"))
      .icon(ShieldCheck)
      .required()
      .width("full"),

    field
      .groupedCheckbox("permissions")
      .label(m.field("permissions"))
      .builderKey("grouped")
      .optionKeys({ value: "id", label: "name" })
      .hint(m.hint("permissions"))
      .required(),
  ];
}
