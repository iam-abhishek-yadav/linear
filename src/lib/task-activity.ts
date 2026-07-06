import { createId } from "@paralleldrive/cuid2";
import { asc, eq } from "drizzle-orm";
import {
  taskActivities,
  users,
  type TaskStatus,
} from "@/db/schema";
import { db } from "@/lib/db";

type DbExecutor = Pick<typeof db, "insert">;

export async function recordTaskCreated(
  executor: DbExecutor,
  {
    taskId,
    userId,
    status,
  }: {
    taskId: string;
    userId: string;
    status: TaskStatus;
  },
) {
  await executor.insert(taskActivities).values({
    id: createId(),
    taskId,
    userId,
    type: "CREATED",
    toStatus: status,
  });
}

export async function recordTaskStatusChange(
  executor: DbExecutor,
  {
    taskId,
    userId,
    fromStatus,
    toStatus,
  }: {
    taskId: string;
    userId: string;
    fromStatus: TaskStatus;
    toStatus: TaskStatus;
  },
) {
  if (fromStatus === toStatus) return;

  await executor.insert(taskActivities).values({
    id: createId(),
    taskId,
    userId,
    type: "STATUS_CHANGED",
    fromStatus,
    toStatus,
  });
}

export async function getTaskActivities(taskId: string) {
  const rows = await db
    .select({
      id: taskActivities.id,
      type: taskActivities.type,
      fromStatus: taskActivities.fromStatus,
      toStatus: taskActivities.toStatus,
      createdAt: taskActivities.createdAt,
      user: {
        id: users.id,
        name: users.name,
      },
    })
    .from(taskActivities)
    .innerJoin(users, eq(taskActivities.userId, users.id))
    .where(eq(taskActivities.taskId, taskId))
    .orderBy(asc(taskActivities.createdAt));

  return rows;
}
