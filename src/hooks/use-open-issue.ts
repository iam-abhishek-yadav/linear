"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { prefetchIssueTimeline } from "@/lib/prefetch-issue";

export function useOpenIssue() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useCallback(
    (taskId: string) => {
      prefetchIssueTimeline(queryClient, taskId);
      router.push(`/issues/${taskId}`);
    },
    [queryClient, router],
  );
}

export function usePrefetchIssueDetail() {
  const queryClient = useQueryClient();

  return useCallback(
    (taskId: string) => {
      prefetchIssueTimeline(queryClient, taskId);
    },
    [queryClient],
  );
}
