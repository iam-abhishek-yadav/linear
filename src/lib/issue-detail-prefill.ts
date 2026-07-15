import type { IssueDetailData } from "@/lib/issue-detail-data";
import type { TaskWithTags } from "@/lib/types";

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
