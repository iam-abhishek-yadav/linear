"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchIssueDetail } from "@/lib/api";
import {
  buildIssueDetailFromTask,
} from "@/lib/issue-detail-prefill";
import type { IssueDetailData } from "@/lib/issue-detail-data";
import { queryKeys } from "@/lib/query-keys";
import type { TaskWithTags } from "@/lib/types";

function getPrefillFromTasksCache(
  queryClient: ReturnType<typeof useQueryClient>,
  taskId: string,
): IssueDetailData | undefined {
  const existing = queryClient.getQueryData<IssueDetailData>(
    queryKeys.issueDetail(taskId),
  );
  if (existing) {
    return existing;
  }

  const tasks = queryClient.getQueryData<TaskWithTags[]>(queryKeys.tasks) ?? [];
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
    placeholderData: () => getPrefillFromTasksCache(queryClient, taskId),
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
