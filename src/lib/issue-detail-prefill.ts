import type { QueryClient } from "@tanstack/react-query";
import type { IssueDetailData } from "@/lib/issue-detail-data";
import { queryKeys } from "@/lib/query-keys";
import type { TaskWithTags } from "@/lib/types";
import { useTasksStore } from "@/stores/tasks-store";

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.toISOString();
}

export function buildIssueDetailFromTask(
  task: TaskWithTags,
  allTasks: TaskWithTags[],
  partial = true,
): IssueDetailData {
  return {
    partial,
    task: {
      ...task,
      dueDate: toIso(task.dueDate),
      completedAt: toIso(task.completedAt),
      createdAt: toIso(task.createdAt) ?? new Date().toISOString(),
      updatedAt: toIso(task.updatedAt) ?? new Date().toISOString(),
      tags: task.tags ?? [],
    },
    tasks: allTasks.map((item) => ({
      id: item.id,
      createdAt: toIso(item.createdAt) ?? new Date().toISOString(),
    })),
    activities: [],
    comments: [],
  };
}

/** Seed issue detail cache from the Zustand tasks store for instant paint. */
export function seedIssueDetailFromTasksCache(
  queryClient: QueryClient,
  taskId: string,
): boolean {
  const existing = queryClient.getQueryData<IssueDetailData>(
    queryKeys.issueDetail(taskId),
  );
  if (existing && !existing.partial) {
    return true;
  }

  const tasks = useTasksStore.getState().tasks;
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return false;
  }

  queryClient.setQueryData(
    queryKeys.issueDetail(taskId),
    buildIssueDetailFromTask(task, tasks, true),
  );
  return true;
}
