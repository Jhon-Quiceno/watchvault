"use client";

import { useState } from "react";
import { ListVideo, Plus, Trash2 } from "lucide-react";

import type { CustomList, LibraryEntry } from "@/types/media";
import { cn } from "@/lib/utils";
import { useLibrary } from "@/features/library/hooks/use-library";
import { useCreateList, useDeleteList, useLists } from "@/features/lists/hooks/use-lists";
import { PosterImage } from "@/components/shared/poster-image";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

export function ListsView() {
  const { data: lists = [], isLoading } = useLists();
  const { data: entries = [] } = useLibrary();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Listas</h1>
          <p className="text-muted-foreground">Armá tus propias colecciones.</p>
        </div>
        <CreateListDialog entries={entries} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : lists.length === 0 ? (
        <div className="border-border/60 flex h-64 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed text-center">
          <span className="bg-accent text-primary grid size-14 place-items-center rounded-2xl">
            <ListVideo className="size-7" />
          </span>
          <p className="text-foreground font-medium">Todavía no hay listas</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Creá una lista como “Studio Ghibli” o “Top 10” y agrupá tus títulos.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} entries={entries} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListCard({ list, entries }: { list: CustomList; entries: LibraryEntry[] }) {
  const deleteList = useDeleteList();
  const members = entries.filter((entry) => list.entryIds.includes(entry.id));

  return (
    <Card className="hover-lift overflow-hidden">
      <div className="grid grid-cols-4 gap-px">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="bg-muted relative aspect-[2/3]">
            <PosterImage src={members[index]?.media.posterUrl ?? null} alt="" sizes="120px" />
          </div>
        ))}
      </div>
      <CardHeader className="gap-1">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base">{list.name}</CardTitle>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Eliminar lista"
            disabled={deleteList.isPending}
            onClick={() => deleteList.mutate(list.id)}
          >
            <Trash2 />
          </Button>
        </div>
        {list.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">{list.description}</p>
        )}
        <p className="text-muted-foreground text-xs">
          {list.entryIds.length} {list.entryIds.length === 1 ? "título" : "títulos"}
        </p>
      </CardHeader>
    </Card>
  );
}

function CreateListDialog({ entries }: { entries: LibraryEntry[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const createList = useCreateList();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit() {
    if (!name.trim()) return;
    createList.mutate(
      {
        name: name.trim(),
        description: description.trim(),
        coverUrl: null,
        entryIds: [...selected],
      },
      {
        onSuccess: () => {
          setOpen(false);
          setName("");
          setDescription("");
          setSelected(new Set());
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="gap-1.5">
            <Plus />
            Nueva lista
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear una lista</DialogTitle>
          <DialogDescription>
            Ponele nombre a tu lista y elegí títulos de tu vault.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nombre de la lista (ej. Studio Ghibli)"
          />
          <Textarea
            rows={2}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descripción (opcional)"
          />
          {entries.length > 0 && (
            <div className="border-border/60 grid max-h-64 grid-cols-3 gap-2 overflow-y-auto rounded-lg border p-2 sm:grid-cols-4">
              {entries.map((entry) => {
                const isSelected = selected.has(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    onClick={() => toggle(entry.id)}
                    className={cn(
                      "relative aspect-[2/3] overflow-hidden rounded-md ring-2 transition",
                      isSelected ? "ring-primary" : "ring-transparent",
                    )}
                  >
                    <PosterImage src={entry.media.posterUrl} alt={entry.media.title} sizes="120px" />
                    {isSelected && <div className="bg-primary/25 absolute inset-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            disabled={!name.trim() || createList.isPending}
            onClick={submit}
            className="w-full sm:w-auto"
          >
            Crear lista · {selected.size} seleccionados
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
