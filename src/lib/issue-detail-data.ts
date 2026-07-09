import { and, asc, eq } from "drizzle-orm";
import type { TaskActivityItem } from "@/components/issues/task-activity-feed";
import type { TaskCommentItem } from "@/components/issues/task-comments";
import { tasks } from "@/db/schema";
import { db } from "@/lib/db";
import { getTaskActivities } from "@/lib/task-activity";
import { getTaskComments } from "@/lib/task-comments";
import type { Task } from "@/lib/types";

export type SerializedTask = Omit<Task, "createdAt" | "updatedAt" | "dueDate"> & {
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
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
};

function serializeTask(task: (typeof tasks.$inferSelect)): SerializedTask {
  return {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}

export async function getIssueDetailData(
  organizationId: string,
  taskId: string,
): Promise<IssueDetailData | null> {
  const [taskRows, taskNav, activities, comments] = await Promise.all([
    db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
      )
      .limit(1),
    db
      .select({ id: tasks.id, createdAt: tasks.createdAt })
      .from(tasks)
      .where(eq(tasks.organizationId, organizationId))
      .orderBy(asc(tasks.createdAt)),
    getTaskActivities(taskId),
    getTaskComments(taskId),
  ]);

  const task = taskRows[0];
  if (!task) return null;

  return {
    task: serializeTask(task),
    tasks: taskNav.map((item) => ({
      id: item.id,
      createdAt: item.createdAt.toISOString(),
    })),
    activities: activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      fromStatus: activity.fromStatus,
      toStatus: activity.toStatus,
      fromPriority: activity.fromPriority,
      toPriority: activity.toPriority,
      fromDueDate: activity.fromDueDate?.toISOString() ?? null,
      toDueDate: activity.toDueDate?.toISOString() ?? null,
      fromAssignee: activity.fromAssignee,
      toAssignee: activity.toAssignee,
      createdAt: activity.createdAt.toISOString(),
      user: activity.user,
    })),
    comments: comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt.toISOString(),
      user: comment.user,
    })),
  };
}
