import { and, eq } from "drizzle-orm";
import { tasks, users } from "@/db/schema";
import { db } from "@/lib/db";

type DbExecutor = Pick<typeof db, "select">;

/** Load a task only if it belongs to the given organization. */
export async function getOrganizationTask(
  organizationId: string,
  taskId: string,
) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
    )
    .limit(1);

  return task ?? null;
}

export async function getOrganizationTaskForUpdate(
  executor: DbExecutor,
  organizationId: string,
  taskId: string,
) {
  const [task] = await executor
    .select()
    .from(tasks)
    .where(
      and(eq(tasks.id, taskId), eq(tasks.organizationId, organizationId)),
    )
    .for("update")
    .limit(1);

  return task ?? null;
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
