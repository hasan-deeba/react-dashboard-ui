/**
 * User create / edit page (/users/create, /users/:id/edit).
 *
 * EDIT    : `transform` strips fields the API must not receive; keep the
 *           password rule (blank on edit = unchanged).
 */

import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { DynamicForm } from "@/components/form";
import type { FormValues } from "@/components/form";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { resourcePaths } from "@/lib/paths";
import { buildUserFields } from "@/views/users/Fields";

export default function UserForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const m = useModelTranslation("users");

  const fields = useMemo(() => buildUserFields(m), [m]);

  const transform = (values: FormValues): Record<string, unknown> => {
    const payload: Record<string, unknown> = { ...values };
    if (isEdit && !payload.password) {
      delete payload.password;
      delete payload.password_confirmation;
    }
    // Only send the image when a new file was picked.
    if (payload.image === null || typeof payload.image === "string") {
      delete payload.image;
    }
    return payload;
  };

  return (
    <DynamicForm
      resource="users"
      recordId={id}
      fields={fields}
      transform={transform}
      redirectTo={resourcePaths("users").index}
      title={isEdit ? m.editTitle : m.createTitle}
      description={isEdit ? m.editDescription : m.createDescription}
    />
  );
}
