import type { QueryClient } from "@tanstack/react-query";
import { fetchTags } from "@/lib/api";
import { queryKeys, TAGS_STALE_MS } from "@/lib/query-keys";

export function prefetchTags(queryClient: QueryClient) {
  void queryClient.prefetchQuery({
    queryKey: queryKeys.tags,
    queryFn: fetchTags,
    staleTime: TAGS_STALE_MS,
  });
}
