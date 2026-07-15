import { cache } from "react";
import type { TaskActivityItem } from "@/components/issues/task-activity-feed";
import type { TaskCommentItem } from "@/lib/task-comments";
import { logServerCall } from "@/lib/logger";
import { getOrganizationTaskWithTags } from "@/lib/tasks";
import { getIssueTimelineData } from "@/lib/issue-timeline-data";
import type { TaskTagSummary } from "@/lib/tags";
import type { Task, TaskWithTags } from "@/lib/types";

export type SerializedTask = Omit<Task, "createdAt" | "updatedAt" | "dueDate" | "completedAt"> & {
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  tags: TaskTagSummary[];
};

export type TaskNavItem = {
  id: string;
  createdAt: string;
};

export type IssueDetailData = {
  task: SerializedTask;
  tasks: TaskNavItem[];
  activities: TaskActivityItem[];
  comments: TaskCommentItem[];
  /** True when seeded from the tasks list; full detail still loading. */
  partial?: boolean;
};

function serializeTask(
  task: TaskWithTags,
): SerializedTask {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    tags: task.tags ?? [],
  };
}

/** Full issue detail for cold-load fallback. Nav is built client-side from the tasks store. */
export const getIssueDetailData = cache(
  (organizationId: string, taskId: string) =>
    logServerCall("getIssueDetailData", async () => {
      const [task, timeline] = await Promise.all([
        getOrganizationTaskWithTags(organizationId, taskId),
        getIssueTimelineData(taskId),
      ]);

      if (!task) return null;

      return {
        task: serializeTask(task),
        tasks: [],
        activities: timeline.activities,
        comments: timeline.comments,
      };
    }),
);
