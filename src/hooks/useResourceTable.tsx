/**
 * Deletion flow for resource list pages.
 *
 * PURPOSE : owns everything a DataTable page repeats — the single-record and
 *           bulk delete confirms, the loading/toast lifecycle, and the
 *           refreshKey that forces the table to refetch after a mutation.
 *           Messages are composed from the model's own namespace.
 * EXPORTS : useResourceTable({ resource, namespace? }) →
 *             { refreshKey, refresh, requestDelete, requestBulkDelete, confirmDialog }.
 * EDIT    : pages must render `confirmDialog` exactly once. Bulk delete runs
 *           in parallel and reports per-failure counts; the table always
 *           refreshes afterwards.
 */

import { useCallback, useState, type ReactNode } from "react";
import { useToast } from "@/components/ui/Toast";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useLanguage } from "@/context/LanguageContext";
import { useModelTranslation } from "@/hooks/useModelTranslation";
import { deleteResource, toggleResourceActive } from "@/services/resources";

interface UseResourceTableOptions {
  /** Laravel resource path, e.g. "users". */
  resource: string;
  /** Locale namespace — defaults to the resource name. */
  namespace?: string;
}

export function useResourceTable<T extends { id: string | number }>({
  resource,
  namespace,
}: UseResourceTableOptions) {
  const { t } = useLanguage();
  const toast = useToast();
  const model = useModelTranslation(namespace ?? resource);

  const [pendingDelete, setPendingDelete] = useState<T | null>(null);
  const [pendingBulk, setPendingBulk] = useState<T[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  /** Bump to force the table to refetch (public escape hatch). */
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);

  const requestDelete = useCallback((row: T) => setPendingDelete(row), []);

  const requestBulkDelete = useCallback((rows: T[]) => {
    if (rows.length > 0) setPendingBulk(rows);
  }, []);

  /**
   * Flip `is_active` (CrudService::toggleActiveStatus) and refresh.
   * Row action handler — no confirm, it is reversible.
   */
  const toggleActive = useCallback(
    async (row: T & { is_active?: boolean }) => {
      try {
        await toggleResourceActive(resource, row.id);
        toast.success(
          row.is_active ? t("general.crud.deactivated") : t("general.crud.activated"),
        );
        refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : t("general.crud.actionFailed"));
      }
    },
    [resource, t, toast, refresh],
  );

  const confirmDelete = useCallback(async () => {
    setDeleting(true);
    try {
      if (pendingDelete) {
        await deleteResource(resource, pendingDelete.id);
        toast.success(model.deletedMessage);
      } else if (pendingBulk) {
        // Parallel on purpose: records are independent; count the failures.
        const results = await Promise.allSettled(
          pendingBulk.map((row) => deleteResource(resource, row.id)),
        );
        const failed = results.filter((result) => result.status === "rejected").length;
        if (failed === 0) toast.success(model.deletedMessage);
        else toast.error(t("general.crud.bulkDeleteFailed", { count: failed }));
      } else {
        return;
      }
      setPendingDelete(null);
      setPendingBulk(null);
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : model.deleteFailedMessage);
      setPendingDelete(null);
      setPendingBulk(null);
    } finally {
      setDeleting(false);
    }
  }, [pendingDelete, pendingBulk, resource, model, t, toast, refresh]);

  const cancelDelete = useCallback(() => {
    if (!deleting) {
      setPendingDelete(null);
      setPendingBulk(null);
    }
  }, [deleting]);

  const confirmDialog: ReactNode = (
    <ConfirmModal
      open={pendingDelete !== null || pendingBulk !== null}
      title={
        pendingBulk ? model.bulkDeleteTitle(pendingBulk.length) : model.deleteTitle
      }
      description={model.deleteDescription}
      confirmLabel={deleting ? t("form.modal.deleting") : t("form.modal.confirm")}
      loading={deleting}
      onConfirm={() => void confirmDelete()}
      onCancel={cancelDelete}
    />
  );

  return {
    refreshKey,
    refresh,
    requestDelete,
    requestBulkDelete,
    toggleActive,
    confirmDialog,
  };
}
