import { createId } from "@paralleldrive/cuid2";
import { asc, eq } from "drizzle-orm";
import { taskComments, users } from "@/db/schema";
import { db } from "@/lib/db";

type DbExecutor = Pick<typeof db, "insert">;

export async function getTaskComments(taskId: string) {
  const rows = await db
    .select({
      id: taskComments.id,
      body: taskComments.body,
      createdAt: taskComments.createdAt,
      user: {
        id: users.id,
        name: users.name,
      },
    })
    .from(taskComments)
    .innerJoin(users, eq(taskComments.userId, users.id))
    .where(eq(taskComments.taskId, taskId))
    .orderBy(asc(taskComments.createdAt));

  return rows;
}

export async function createTaskComment(
  executor: DbExecutor,
  {
    taskId,
    userId,
    body,
  }: {
    taskId: string;
    userId: string;
    body: string;
  },
) {
  const id = createId();
  await executor.insert(taskComments).values({ id, taskId, userId, body });
  return id;
}
