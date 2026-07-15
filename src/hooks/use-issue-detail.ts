"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchIssueDetail } from "@/lib/api";
import { buildIssueDetailFromTask } from "@/lib/issue-detail-prefill";
import type { IssueDetailData } from "@/lib/issue-detail-data";
import { queryKeys } from "@/lib/query-keys";
import { useTasksStore } from "@/stores/tasks-store";

function getPrefillFromTasksStore(taskId: string): IssueDetailData | undefined {
  const tasks = useTasksStore.getState().tasks;
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return undefined;
  }
  return buildIssueDetailFromTask(task, tasks, true);
}

export function useIssueDetail(taskId: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.issueDetail(taskId),
    queryFn: () => fetchIssueDetail(taskId),
    enabled: Boolean(taskId),
    staleTime: 0,
    placeholderData: () => {
      const existing = queryClient.getQueryData<IssueDetailData>(
        queryKeys.issueDetail(taskId),
      );
      if (existing) return existing;
      return getPrefillFromTasksStore(taskId);
    },
  });

  const error =
    query.isError
      ? ("failed" as const)
      : query.isSuccess && query.data === null
        ? ("not_found" as const)
        : null;

  return {
    data: query.data ?? null,
    loading: query.isPending && !query.data && !query.isPlaceholderData,
    isFetching: query.isFetching,
    error,
    refetch: query.refetch,
  };
}
