/**
 * Role create / edit page (/roles/create, /roles/:id/edit).
 */

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { DynamicForm } from "@/components/form";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { resourcePaths } from "@/lib/paths";
import { buildRoleFields } from "@/views/roles/Fields";

export default function RoleForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const m = useModelTranslation("roles");

  const fields = useMemo(() => buildRoleFields(m), [m]);

  return (
    <DynamicForm
      resource="roles"
      recordId={id}
      fields={fields}
      redirectTo={resourcePaths("roles").index}
      title={isEdit ? m.editTitle : m.createTitle}
      description={isEdit ? m.editDescription : m.createDescription}
    />
  );
}
