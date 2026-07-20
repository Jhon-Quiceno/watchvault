"use client";

import { useState } from "react";
import { Trash2, X } from "lucide-react";
import { toast } from "sonner";

import type { WatchStatus } from "@/types/media";
import { WATCH_STATUSES, WATCH_STATUS_LABELS } from "@/lib/format";
import { useRemoveEntry, useUpdateEntry } from "@/features/library/hooks/use-library";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { SimpleSelect, type SelectOption } from "@/components/shared/simple-select";
import { Button } from "@/components/ui/button";

const STATUS_OPTIONS: SelectOption[] = WATCH_STATUSES.map((status) => ({
  value: status,
  label: WATCH_STATUS_LABELS[status],
}));

function tituloWord(count: number) {
  return count === 1 ? "título" : "títulos";
}

export function LibraryBulkActionsBar({
  selectedIds,
  onClearSelection,
  onExit,
}: {
  selectedIds: string[];
  onClearSelection: () => void;
  onExit: () => void;
}) {
  const updateEntry = useUpdateEntry();
  const removeEntry = useRemoveEntry();
  const [applyingStatus, setApplyingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const count = selectedIds.length;
  const busy = applyingStatus || deleting;

  async function applyStatus(status: string) {
    setApplyingStatus(true);
    // One at a time: each update is a full read-modify-write of the same
    // shared Blob file, and firing them all in parallel can exceed the
    // write's own conflict-retry budget under real contention.
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await updateEntry.mutateAsync({ id, patch: { status: status as WatchStatus }, silent: true });
      } catch {
        failed += 1;
      }
    }
    setApplyingStatus(false);
    if (failed === 0) {
      toast.success(`Se actualizó el estado de ${count} ${tituloWord(count)}`);
    } else if (failed === count) {
      toast.error("No se pudo actualizar el estado de los títulos seleccionados");
    } else {
      toast.error(`No se pudo actualizar el estado de ${failed} ${tituloWord(failed)}`);
    }
    onClearSelection();
  }

  async function confirmDelete() {
    setDeleting(true);
    let failed = 0;
    for (const id of selectedIds) {
      try {
        await removeEntry.mutateAsync({ id, silent: true });
      } catch {
        failed += 1;
      }
    }
    setDeleting(false);
    setConfirmOpen(false);
    if (failed === 0) {
      toast.success(`Se quitaron ${count} ${tituloWord(count)} de tu vault`);
    } else if (failed === count) {
      toast.error("No se pudieron quitar los títulos seleccionados");
    } else {
      toast.error(`No se pudieron quitar ${failed} ${tituloWord(failed)}`);
    }
    onClearSelection();
  }

  return (
    <>
      <div className="border-border/60 bg-popover sticky bottom-4 z-40 mx-auto flex w-fit max-w-full flex-wrap items-center gap-3 rounded-2xl border p-3 shadow-lg ring-1 ring-foreground/10">
        <p className="px-1 text-sm font-medium">
          {count} {tituloWord(count)} seleccionado{count === 1 ? "" : "s"}
        </p>
        <SimpleSelect
          value=""
          onValueChange={applyStatus}
          options={STATUS_OPTIONS}
          placeholder="Cambiar estado…"
          size="sm"
          disabled={busy}
        />
        <Button
          variant="destructive"
          size="sm"
          className="gap-1.5"
          disabled={busy}
          onClick={() => setConfirmOpen(true)}
        >
          <Trash2 className="size-4" />
          Quitar
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Salir de selección" onClick={onExit}>
          <X />
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`¿Quitar ${count} ${tituloWord(count)} de tu vault?`}
        description="Esta acción no se puede deshacer."
        confirmLabel="Quitar"
        pendingLabel="Quitando…"
        loading={deleting}
        onConfirm={confirmDelete}
      />
    </>
  );
}
