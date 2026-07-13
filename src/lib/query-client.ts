import { QueryClient } from "@tanstack/react-query";
import { GC_TIME_MS, STALE_TIME_MS } from "@/lib/query-keys";

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIME_MS,
        gcTime: GC_TIME_MS,
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}
