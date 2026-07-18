"use client";

import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { LibraryEntry } from "@/types/media";
import type { AddToLibraryInput, UpdateEntryInput } from "@/lib/schemas/library";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

/** Demo deployments block writes with a 403; show a distinct, friendlier toast for that case. */
function showMutationError(error: unknown, fallbackMessage: string) {
  if (isAxiosError(error) && error.response?.status === 403) {
    toast.info(error.response.data?.error ?? "Estás en modo demo: los cambios no se guardan.");
    return;
  }
  toast.error(fallbackMessage);
}

async function fetchLibrary(): Promise<LibraryEntry[]> {
  const { data } = await apiClient.get<{ entries: LibraryEntry[] }>("/library");
  return data.entries;
}

export function useLibrary() {
  return useQuery({ queryKey: queryKeys.library.all, queryFn: fetchLibrary });
}

export function useAddToLibrary() {
  const queryClient = useQueryClient();
  return useMutation({
    // `silent` is destructured out here so it never leaks into the POST body sent to the API.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async ({ silent, ...input }: AddToLibraryInput & { silent?: boolean }) => {
      const { data } = await apiClient.post<{ entry: LibraryEntry }>("/library", input);
      return data.entry;
    },
    onSuccess: (entry, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all });
      if (!variables.silent) toast.success(`“${entry.media.title}” agregado a tu vault`);
    },
    onError: (error, variables) => {
      if (!variables.silent) showMutationError(error, "No se pudo agregar este título");
    },
  });
}

export function useUpdateEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: UpdateEntryInput;
      /** Skips this mutation's own toast — used by bulk actions, which show one summary toast. */
      silent?: boolean;
    }) => {
      const { data } = await apiClient.patch<{ entry: LibraryEntry }>(`/library/${id}`, patch);
      return data.entry;
    },
    onMutate: async ({ id, patch }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.library.all });
      const previous = queryClient.getQueryData<LibraryEntry[]>(queryKeys.library.all);
      queryClient.setQueryData<LibraryEntry[]>(queryKeys.library.all, (entries) =>
        (entries ?? []).map((entry) =>
          entry.id === id
            ? { ...entry, ...patch, progress: { ...entry.progress, ...patch.progress } }
            : entry,
        ),
      );
      return { previous };
    },
    onError: (error, variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.library.all, context.previous);
      }
      if (!variables.silent) showMutationError(error, "No se pudieron guardar los cambios");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all });
    },
  });
}

type RemoveEntryInput = string | { id: string; silent?: boolean };

function normalizeRemoveInput(input: RemoveEntryInput) {
  return typeof input === "string" ? { id: input, silent: false } : { id: input.id, silent: input.silent ?? false };
}

export function useRemoveEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: RemoveEntryInput) => {
      const { id } = normalizeRemoveInput(input);
      await apiClient.delete(`/library/${id}`);
      return id;
    },
    onMutate: async (input) => {
      const { id } = normalizeRemoveInput(input);
      await queryClient.cancelQueries({ queryKey: queryKeys.library.all });
      const previous = queryClient.getQueryData<LibraryEntry[]>(queryKeys.library.all);
      queryClient.setQueryData<LibraryEntry[]>(queryKeys.library.all, (entries) =>
        (entries ?? []).filter((entry) => entry.id !== id),
      );
      return { previous };
    },
    onError: (error, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.library.all, context.previous);
      }
      if (!normalizeRemoveInput(input).silent) {
        showMutationError(error, "No se pudo quitar el título");
      }
    },
    onSuccess: (_id, input) => {
      if (!normalizeRemoveInput(input).silent) toast.success("Se quitó de tu vault");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.library.all });
    },
  });
}
