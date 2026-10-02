/**
 * Settings page (/settings).
 *
 * PURPOSE : edits the singleton `settings` resource —
 *           `GET settings` to load, `POST settings` to save.
 * EDIT    : uses DynamicForm's `singleton` mode, so there is no record id
 *           and no redirect: the user stays on the page after saving.
 */

import { useMemo } from "react";
import { DynamicForm } from "@/components/form";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { buildSettingsFields } from "@/views/settings/Fields";

export default function Settings() {
  const m = useModelTranslation("settings");
  const fields = useMemo(() => buildSettingsFields(m), [m]);

  return (
    <DynamicForm
      resource="settings"
      singleton
      fields={fields}
      title={m.plural}
      description={m.description}
    />
  );
}
