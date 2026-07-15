"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { fetchIssueDetail } from "@/lib/api";
import { seedIssueDetailFromTasksCache } from "@/lib/issue-detail-prefill";
import { queryKeys } from "@/lib/query-keys";

export function useOpenIssue() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(
    (taskId: string) => {
      seedIssueDetailFromTasksCache(queryClient, taskId);
      void queryClient.prefetchQuery({
        queryKey: queryKeys.issueDetail(taskId),
        queryFn: () => fetchIssueDetail(taskId),
      });
      router.push(`/issues/${taskId}`);
    },
    [queryClient, router],
  );
}

export function usePrefetchIssueDetail() {
  const queryClient = useQueryClient();

  return useCallback(
    (taskId: string) => {
      if (!taskId) return;
      seedIssueDetailFromTasksCache(queryClient, taskId);
      void queryClient.prefetchQuery({
        queryKey: queryKeys.issueDetail(taskId),
        queryFn: () => fetchIssueDetail(taskId),
      });
    },
    [queryClient],
  );
}
