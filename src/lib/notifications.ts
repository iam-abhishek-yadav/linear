import { createId } from "@paralleldrive/cuid2";
import { aliasedTable, and, desc, eq, isNull } from "drizzle-orm";
import { notifications, tasks, users } from "@/db/schema";
import { db } from "@/lib/db";

type DbExecutor = Pick<typeof db, "insert">;

/**
 * Record an assignment notification for the assignee. No-op when a user
 * assigns a task to themselves (you don't need to notify yourself).
 */
export async function createAssignmentNotification(
  executor: DbExecutor,
  {
    recipientId,
    actorId,
    taskId,
  }: {
    recipientId: string;
    actorId: string;
    taskId: string;
  },
) {
  if (recipientId === actorId) return;

  await executor.insert(notifications).values({
    id: createId(),
    userId: recipientId,
    actorId,
    taskId,
    type: "ASSIGNED",
  });
}

export async function getNotifications(userId: string) {
  const actor = aliasedTable(users, "actor");

  const rows = await db
    .select({
      id: notifications.id,
      type: notifications.type,
      readAt: notifications.readAt,
      createdAt: notifications.createdAt,
      actor: {
        id: actor.id,
        name: actor.name,
      },
      task: {
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
      },
    })
    .from(notifications)
    .innerJoin(tasks, eq(notifications.taskId, tasks.id))
    .leftJoin(actor, eq(notifications.actorId, actor.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));

  return rows;
}

export async function markNotificationRead(
  userId: string,
  notificationId: string,
) {
  const [updated] = await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId),
      ),
    )
    .returning({ id: notifications.id });

  return updated ?? null;
}

export async function markAllNotificationsRead(userId: string) {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(eq(notifications.userId, userId), isNull(notifications.readAt)),
    );
}
