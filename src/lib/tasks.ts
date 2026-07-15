import { and, asc, eq, inArray, isNull, or } from "drizzle-orm";
import { cache } from "react";
import { tasks } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db, withDbRetry } from "@/lib/db";
import { logServerCall } from "@/lib/logger";
import { listUserProjectIds, canAccessTaskProject } from "@/lib/project-access";
import { attachTagsToTasks, getTagsForTask, getTagsForTaskIds } from "@/lib/tags";
import type { TaskWithTags } from "@/lib/types";

async function queryOrgTasks(
  organizationId: string,
  userId: string,
): Promise<TaskWithTags[]> {
  const memberProjectIds = await listUserProjectIds(userId);

  const visibility =
    memberProjectIds.length === 0
      ? isNull(tasks.projectId)
      : or(isNull(tasks.projectId), inArray(tasks.projectId, memberProjectIds));

  const taskRows = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.organizationId, organizationId), visibility))
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
      withDbRetry(() =>
        queryOrgTasks(session.organization.id, session.user.id),
      ),
    );
  }),
);

export async function getOrganizationTaskWithTags(
  organizationId: string,
  taskId: string,
  viewerUserId: string,
): Promise<TaskWithTags | null> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)))
    .limit(1);

  if (!task) {
    return null;
  }

  const allowed = await canAccessTaskProject(viewerUserId, task.projectId);
  if (!allowed) {
    return null;
  }

  const taskTags = await getTagsForTask(taskId);
  return { ...task, tags: taskTags };
}
