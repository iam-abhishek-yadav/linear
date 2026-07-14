import { and, asc, eq } from "drizzle-orm";
import { cache } from "react";
import { tasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
import { logServerCall } from "@/lib/logger";
import { attachTagsToTasks, getTagsForTask, getTagsForTaskIds } from "@/lib/tags";
import type { TaskWithTags } from "@/lib/types";

async function queryOrgTasks(organizationId: string): Promise<TaskWithTags[]> {
  const taskRows = await db
    .select()
    .from(tasks)
    .where(eq(tasks.organizationId, organizationId))
    .orderBy(asc(tasks.status), asc(tasks.position));

  const tagsByTaskId = await getTagsForTaskIds(taskRows.map((task) => task.id));
  return attachTagsToTasks(taskRows, tagsByTaskId);
}

export const getOrgTasks = cache(() =>
  logServerCall("getOrgTasks", async (): Promise<TaskWithTags[]> => {
    const session = await getCurrentUser();
    if (!session) {
      return [];
    }

    return logServerCall("getOrgTasks.query", () =>
      withDbRetry(() => queryOrgTasks(session.organization.id)),
    );
  }),
);

export async function getOrganizationTaskWithTags(
  organizationId: string,
  taskId: string,
): Promise<TaskWithTags | null> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)))
    .limit(1);

  if (!task) {
    return null;
  }

  const taskTags = await getTagsForTask(taskId);
  return { ...task, tags: taskTags };
}
