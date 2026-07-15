"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTask } from "@/lib/api";
import { buildIssueDetailFromTask } from "@/lib/issue-detail-prefill";
import type { IssueDetailData } from "@/lib/issue-detail-data";
import { queryKeys, STALE_TIME_MS } from "@/lib/query-keys";
import { useIssueTimeline } from "@/hooks/use-issue-timeline";
import { useTasksStore } from "@/stores/tasks-store";

export function useIssueDetail(taskId: string) {
  const tasks = useTasksStore((state) => state.tasks);
  const taskFromStore = useMemo(
    () => tasks.find((item) => item.id === taskId),
    [tasks, taskId],
  );

  const coldTaskQuery = useQuery({
    queryKey: queryKeys.task(taskId),
    queryFn: () => fetchTask(taskId),
    enabled: !taskFromStore && Boolean(taskId),
    staleTime: STALE_TIME_MS,
  });

  const task = taskFromStore ?? coldTaskQuery.data ?? null;
  const timelineQuery = useIssueTimeline(taskId, { enabled: Boolean(task) });

  const data = useMemo((): IssueDetailData | null => {
    if (!task) return null;

    const navTasks = tasks.length > 0 ? tasks : [task];
    const base = buildIssueDetailFromTask(task, navTasks, true);

    return {
      ...base,
      activities: timelineQuery.data?.activities ?? [],
      comments: timelineQuery.data?.comments ?? [],
      partial: !timelineQuery.data,
    };
  }, [task, tasks, timelineQuery.data]);

  const error =
    coldTaskQuery.isError || timelineQuery.isError
      ? ("failed" as const)
      : coldTaskQuery.isSuccess && coldTaskQuery.data === null
        ? ("not_found" as const)
        : null;

  const loading =
    !task &&
    (coldTaskQuery.isPending || (Boolean(taskId) && !coldTaskQuery.isFetched));

  const isLoadingTimeline =
    Boolean(task) && timelineQuery.isPending && !timelineQuery.data;

  return {
    data,
    loading,
    isLoadingTimeline,
    isFetching: timelineQuery.isFetching,
    error,
    refetch: async () => {
      await Promise.all([
        coldTaskQuery.refetch(),
        timelineQuery.refetch(),
      ]);
    },
  };
}
