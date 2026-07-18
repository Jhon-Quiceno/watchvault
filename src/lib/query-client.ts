import { QueryClient } from "@tanstack/react-query";

/**
 * Factory for a configured QueryClient. Kept as a factory (rather than a
 * module-level singleton) so each request/render gets its own instance on
 * the server, while the client still reuses one instance across renders.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
