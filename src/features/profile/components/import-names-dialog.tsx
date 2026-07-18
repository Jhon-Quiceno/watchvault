"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { WatchStatus } from "@/types/media";
import { WATCH_STATUSES, WATCH_STATUS_LABELS } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { useAddToLibrary, useLibrary } from "@/features/library/hooks/use-library";
import { parseNameList, type ParseNameListResult } from "@/features/profile/lib/parse-names";
import { useNameResolution } from "@/features/profile/hooks/use-name-resolution";
import {
  ImportNameRow,
  SKIP_VALUE,
  decodeCandidateId,
} from "@/features/profile/components/import-name-row";
import { SimpleSelect, type SelectOption } from "@/components/shared/simple-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";

const STATUS_OPTIONS: SelectOption[] = WATCH_STATUSES.map((status) => ({
  value: status,
  label: WATCH_STATUS_LABELS[status],
}));

type Phase = "paste" | "review" | "importing" | "done";

interface ImportSummary {
  added: number;
  alreadyInLibrary: number;
  noMatch: number;
  failed: number;
}

const INITIAL_PARSE: ParseNameListResult = { items: [], duplicatesRemoved: 0, truncated: 0 };

export function ImportNamesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: entries = [] } = useLibrary();
  const addToLibrary = useAddToLibrary();
  const fileInput = useRef<HTMLInputElement>(null);

  const [phase, setPhase] = useState<Phase>("paste");
  const [text, setText] = useState("");
  const [parseResult, setParseResult] = useState(INITIAL_PARSE);
  const [batchStatus, setBatchStatus] = useState<WatchStatus>("plan_to_watch");
  const [selection, setSelection] = useState<Record<number, string>>({});
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("paste");
    setText("");
    setParseResult(INITIAL_PARSE);
    setBatchStatus("plan_to_watch");
    setSelection({});
    setSummary(null);
  }, [open]);

  const alreadyInLibraryIds = useMemo(
    () => new Set(entries.map((entry) => `${entry.media.provider}:${entry.media.providerId}`)),
    [entries],
  );

  const rows = useNameResolution(parseResult.items, phase === "review");

  useEffect(() => {
    if (phase !== "review") return;
    setSelection((prev) => {
      let changed = false;
      const next = { ...prev };
      rows.forEach((row, index) => {
        if (next[index] !== undefined) return;
        if (row.isLoading || row.isError || row.results.length === 0) return;
        const first = row.results[0];
        if (!first) return;
        const yearMatch = row.yearHint
          ? row.results.find((candidate) => candidate.year === row.yearHint)
          : undefined;
        next[index] = (yearMatch ?? first).id;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [rows, phase]);

  function handleContinue() {
    const result = parseNameList(text);
    if (result.items.length === 0) {
      toast.error("Pegá al menos un título");
      return;
    }
    setParseResult(result);
    setSelection({});
    setPhase("review");
  }

  async function handleImport() {
    setPhase("importing");

    const seenKeys = new Set<string>();
    const items: NonNullable<ReturnType<typeof decodeCandidateId>>[] = [];
    let alreadyCount = 0;
    let noMatchCount = 0;

    rows.forEach((_row, index) => {
      const value = selection[index];
      if (!value || value === SKIP_VALUE) {
        noMatchCount += 1;
        return;
      }
      const decoded = decodeCandidateId(value);
      if (!decoded) {
        noMatchCount += 1;
        return;
      }
      const key = `${decoded.provider}:${decoded.providerId}`;
      if (alreadyInLibraryIds.has(key) || seenKeys.has(key)) {
        alreadyCount += 1;
        return;
      }
      seenKeys.add(key);
      items.push(decoded);
    });

    const results = await Promise.allSettled(
      items.map((item) =>
        addToLibrary.mutateAsync({ ...item, status: batchStatus, silent: true }),
      ),
    );

    const added = results.filter((result) => result.status === "fulfilled").length;
    const failed = results.filter((result) => result.status === "rejected").length;

    await queryClient.invalidateQueries({ queryKey: queryKeys.library.all });

    setSummary({ added, alreadyInLibrary: alreadyCount, noMatch: noMatchCount, failed });
    setPhase("done");
    toast.success(
      `Importación completa: ${added} agregados, ${alreadyCount} ya en biblioteca, ${noMatchCount} sin coincidencia, ${failed} con error`,
    );
  }

  function handleOpenChange(next: boolean) {
    if (!next && phase === "importing") return;
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl lg:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar por nombres</DialogTitle>
          <DialogDescription>
            Pegá una lista de títulos, uno por línea, y elegí qué agregar a tu biblioteca.
          </DialogDescription>
        </DialogHeader>

        {phase === "paste" && (
          <div className="flex flex-col gap-3">
            <Textarea
              rows={10}
              placeholder="Un título por línea…"
              value={text}
              onChange={(event) => setText(event.target.value)}
            />
            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => fileInput.current?.click()}>
                Subir archivo .txt
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="text/plain"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void file.text().then(setText);
                  event.target.value = "";
                }}
              />
            </div>
          </div>
        )}

        {phase === "review" && (
          <div className="flex flex-col gap-4">
            {(parseResult.duplicatesRemoved > 0 || parseResult.truncated > 0) && (
              <p className="text-muted-foreground text-xs">
                {parseResult.duplicatesRemoved > 0 &&
                  `Se descartaron ${parseResult.duplicatesRemoved} duplicados. `}
                {parseResult.truncated > 0 &&
                  `Se ignoraron ${parseResult.truncated} títulos por superar el límite de 50 por lote.`}
              </p>
            )}

            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground text-xs font-medium">Estado a aplicar</span>
              <SimpleSelect
                value={batchStatus}
                onValueChange={(value) => setBatchStatus(value as WatchStatus)}
                options={STATUS_OPTIONS}
                size="sm"
              />
            </label>

            <ScrollArea className="h-[360px] rounded-lg border">
              <div className="px-4">
                {rows.map((row, index) => (
                  <ImportNameRow
                    key={`${row.raw}-${index}`}
                    raw={row.raw}
                    yearHint={row.yearHint}
                    isLoading={row.isLoading}
                    isError={row.isError}
                    results={row.results}
                    refetch={row.refetch}
                    selectedValue={selection[index] ?? SKIP_VALUE}
                    onSelectedChange={(value) =>
                      setSelection((prev) => ({ ...prev, [index]: value }))
                    }
                    alreadyInLibraryIds={alreadyInLibraryIds}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {phase === "importing" && (
          <p className="text-muted-foreground py-8 text-center text-sm">Importando…</p>
        )}

        {phase === "done" && summary && (
          <div className="flex flex-col gap-1 py-4 text-sm">
            <p>{summary.added} agregados</p>
            <p>{summary.alreadyInLibrary} ya en tu biblioteca</p>
            <p>{summary.noMatch} sin coincidencia</p>
            <p>{summary.failed} con error</p>
          </div>
        )}

        <DialogFooter>
          {phase === "paste" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleContinue}>Continuar</Button>
            </>
          )}
          {phase === "review" && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={() => void handleImport()}>Importar</Button>
            </>
          )}
          {phase === "done" && <Button onClick={() => onOpenChange(false)}>Cerrar</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
