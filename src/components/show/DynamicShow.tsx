import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/Toast";
import { LoadingPanel } from "@/components/ui/Loading";
import { NotFound as NotFoundPage } from "@/components/pages/NotFound";
import { showResource } from "@/services/resources";
import { resourcePaths } from "@/lib/paths";
import { resourcePermissions } from "@/lib/permissions";
import { ShowHeader } from "./ShowHeader";
import { ShowSectionCard } from "./ShowSectionCard";
import { ShowTimestamps } from "./ShowTimestamps";
import type { DynamicShowProps } from "./types";

export type {
  DynamicShowProps,
  ShowEntry,
  ShowEntryType,
  ShowHeaderData,
  ShowSection,
  TimestampKeys,
} from "./types";

/**
 *   <DynamicShow resource="users" recordId={id} sections={sections}
 *     header={(u) => ({ title: u.name, subtitle: u.email, image: u.image })}
 *     aside={(u) => <RelatedUsers users={u.reports} />} />
 *
 * Handles: fetching, loading, 404-when-missing, default CRUD URLs
 * (`/{resource}` back, `/{resource}/{id}/edit`), timestamps footer, and an
 * optional `aside` column rendered beside the main sections.
 */
export function DynamicShow<T extends Record<string, unknown>>({
  record: recordProp,
  resource,
  recordId,
  sections,
  title,
  titleKey,
  header,
  aside,
  backPath,
  editPath,
  editPermission,
  showTimestamps = true,
  timestampKeys,
}: DynamicShowProps<T>) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const toast = useToast();
  const { can } = useAuth();

  /** Default resource URLs (overridable via backPath/editPath). */
  const paths = useMemo(() => (resource ? resourcePaths(resource) : null), [resource]);

  const shouldFetch = !recordProp && Boolean(resource && recordId);
  const [record, setRecord] = useState<T | undefined>(recordProp);
  const [loading, setLoading] = useState(shouldFetch);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!shouldFetch) {
      setRecord(recordProp);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    showResource<T>(resource!, recordId!)
      .then((data) => {
        if (!cancelled) setRecord(data);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const err = e instanceof Error ? e : new Error(String(e));
        setError(err);
        toast.error(t("show.notFound"), { description: err.message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shouldFetch, resource, recordId, recordProp, t, toast]);

  const summary = useMemo(() => (record && header ? header(record) : null), [record, header]);

  /* -------------------------------- loading ------------------------------- */
  if (loading) return <LoadingPanel />;

  /* ------------------------- missing record → 404 ------------------------- */
  if (error || !record) {
    return <NotFoundPage />;
  }

  /* -------------------------------- handlers ------------------------------ */
  const goBack = () => {
    if (backPath) navigate(backPath);
    else if (paths) navigate(paths.index);
    else navigate(-1);
  };

  /**
   * Edit is shown only when the user holds the resource's edit permission
   * (defaults to `{resource}.edit`; pass `editPermission={null}` to skip).
   */
  const requiredEditPermission =
    editPermission === null
      ? undefined
      : (editPermission ?? (resource ? resourcePermissions(resource).edit : undefined));

  const recordId_ = record.id as string | number | undefined;
  const canEdit = can(requiredEditPermission);
  const goEdit = !canEdit
    ? undefined
    : editPath
      ? () => navigate(editPath(record))
      : paths && recordId_ !== undefined
        ? () => navigate(paths.edit(recordId_))
        : undefined;

  /* --------------------------------- render -------------------------------- */
  const asideContent = aside?.(record);
  const created = record[timestampKeys?.created ?? "created_at"];
  const updated = record[timestampKeys?.updated ?? "updated_at"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-[var(--gap-grid)]"
    >
      <ShowHeader
        summary={summary}
        fallbackTitle={title}
        fallbackTitleKey={titleKey}
        onBack={goBack}
        onEdit={goEdit}
      />

      {asideContent ? (
        <div className="grid gap-[var(--gap-grid)] lg:grid-cols-3">
          <div className="space-y-[var(--gap-grid)] lg:col-span-2">
            {sections.map((section, index) => (
              <ShowSectionCard
                key={section.titleKey ?? section.title ?? index}
                section={section}
                record={record}
              />
            ))}
          </div>
          <div className="space-y-[var(--gap-grid)]">{asideContent}</div>
        </div>
      ) : (
        sections.map((section, index) => (
          <ShowSectionCard
            key={section.titleKey ?? section.title ?? index}
            section={section}
            record={record}
          />
        ))
      )}

      {showTimestamps && (
        <ShowTimestamps
          created={created !== undefined && created !== null ? String(created) : null}
          updated={updated !== undefined && updated !== null ? String(updated) : null}
        />
      )}
    </motion.div>
  );
}
