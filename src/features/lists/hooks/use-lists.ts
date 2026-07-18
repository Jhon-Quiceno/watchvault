"use client";

import { isAxiosError } from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { CustomList } from "@/types/media";
import type { ListInput } from "@/lib/schemas/library";
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

export function useLists() {
  return useQuery({
    queryKey: queryKeys.lists.all,
    queryFn: async () => {
      const { data } = await apiClient.get<{ lists: CustomList[] }>("/lists");
      return data.lists;
    },
  });
}

export function useCreateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ListInput) => {
      const { data } = await apiClient.post<{ list: CustomList }>("/lists", input);
      return data.list;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
      toast.success("Lista creada");
    },
    onError: (error) => showMutationError(error, "No se pudo crear la lista"),
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ListInput }) => {
      const { data } = await apiClient.put<{ list: CustomList }>(`/lists/${id}`, input);
      return data.list;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.lists.all }),
    onError: (error) => showMutationError(error, "No se pudo actualizar la lista"),
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/lists/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.lists.all });
      toast.success("Lista eliminada");
    },
    onError: (error) => showMutationError(error, "No se pudo eliminar la lista"),
  });
}
