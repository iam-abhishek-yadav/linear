import type { QueryClient } from "@tanstack/react-query";
import { fetchIssueTimeline } from "@/lib/api";
import {
  ISSUE_TIMELINE_STALE_MS,
  queryKeys,
} from "@/lib/query-keys";

/** Prefetch activities + comments for an issue (lightweight timeline endpoint). */
export function prefetchIssueTimeline(
  queryClient: QueryClient,
  taskId: string,
) {
  if (!taskId) return;
  void queryClient.prefetchQuery({
    queryKey: queryKeys.issueTimeline(taskId),
    queryFn: () => fetchIssueTimeline(taskId),
    staleTime: ISSUE_TIMELINE_STALE_MS,
  });
}
