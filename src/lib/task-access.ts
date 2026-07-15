import { and, eq } from "drizzle-orm";
import { tasks, users } from "@/db/schema";
import { db } from "@/lib/db";
import { canAccessTaskProject } from "@/lib/project-access";

type DbExecutor = Pick<typeof db, "select">;

/** Load a task only if it belongs to the org and the viewer can access its project. */
export async function getOrganizationTask(
  organizationId: string,
  taskId: string,
  viewerUserId: string,
) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
    )
    .limit(1);

  if (!task) return null;

  const allowed = await canAccessTaskProject(viewerUserId, task.projectId);
  if (!allowed) return null;

  return task;
}

export async function getOrganizationTaskForUpdate(
  executor: DbExecutor,
  organizationId: string,
  taskId: string,
  viewerUserId: string,
) {
  const [task] = await executor
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
    )
    .for("update")
    .limit(1);

  if (!task) return null;

  const allowed = await canAccessTaskProject(viewerUserId, task.projectId);
  if (!allowed) return null;

  return task;
}

/** True when assigneeId is null/undefined or the user is in organizationId. */
export async function isAssigneeInOrganization(
  assigneeId: string | null | undefined,
  organizationId: string,
) {
  if (!assigneeId) return true;

  const [member] = await db
    .select({ id: users.id })
    .from(users)
    .where(
      and(
        eq(users.id, assigneeId),
        eq(users.organizationId, organizationId),
      ),
    )
    .limit(1);

  return Boolean(member);
}
