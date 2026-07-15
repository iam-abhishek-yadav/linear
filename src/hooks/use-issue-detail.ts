"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProjectAccessDenied } from "@/lib/api";
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

  const coldResult = coldTaskQuery.data;
  const coldTask =
    coldResult?.status === "ok" ? coldResult.task : null;
  const projectAccess: ProjectAccessDenied | null =
    !taskFromStore && coldResult?.status === "project_access"
      ? coldResult.access
      : null;

  const task = taskFromStore ?? coldTask;
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
    projectAccess
      ? null
      : coldTaskQuery.isError || timelineQuery.isError
        ? ("failed" as const)
        : coldTaskQuery.isSuccess && coldResult?.status === "not_found"
          ? ("not_found" as const)
          : coldTaskQuery.isSuccess && coldResult?.status === "error"
            ? ("failed" as const)
            : null;

  const loading =
    !task &&
    !projectAccess &&
    (coldTaskQuery.isPending || (Boolean(taskId) && !coldTaskQuery.isFetched));

  const isLoadingTimeline =
    Boolean(task) && timelineQuery.isPending && !timelineQuery.data;

  return {
    data,
    loading,
    isLoadingTimeline,
    isFetching: timelineQuery.isFetching,
    error,
    projectAccess,
    refetch: async () => {
      await Promise.all([
        coldTaskQuery.refetch(),
        timelineQuery.refetch(),
      ]);
    },
  };
}
