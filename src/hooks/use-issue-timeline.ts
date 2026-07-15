"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIssueTimeline } from "@/lib/api";
import { ISSUE_TIMELINE_STALE_MS, queryKeys } from "@/lib/query-keys";

export function useIssueTimeline(
  taskId: string,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: queryKeys.issueTimeline(taskId),
    queryFn: () => fetchIssueTimeline(taskId),
    enabled: options?.enabled ?? Boolean(taskId),
    staleTime: ISSUE_TIMELINE_STALE_MS,
  });
}
