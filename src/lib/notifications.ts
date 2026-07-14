import { createId } from "@paralleldrive/cuid2";
import { aliasedTable, and, desc, eq, isNotNull, isNull, lt } from "drizzle-orm";
import { cache } from "react";
import {
  notifications,
  tasks,
  users,
  type NotificationType,
} from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logServerCall } from "@/lib/logger";
import type { NotificationItem } from "@/lib/notification-types";
import { toIsoString } from "@/lib/serialize";

const NOTIFICATION_RETENTION_MS = 24 * 60 * 60 * 1000;

type DbExecutor = Pick<typeof db, "insert">;

async function createNotification(
  executor: DbExecutor,
  {
    recipientId,
    actorId,
    taskId,
    type,
  }: {
    recipientId: string;
    actorId: string;
    taskId: string;
    type: NotificationType;
  },
) {
  if (recipientId === actorId) return;

  await executor.insert(notifications).values({
    id: createId(),
    userId: recipientId,
    actorId,
    taskId,
    type,
  });
}

/**
 * Record an assignment notification for the assignee. No-op when a user
 * assigns a task to themselves (you don't need to notify yourself).
 */
export async function createAssignmentNotification(
  executor: DbExecutor,
  params: {
    recipientId: string;
    actorId: string;
    taskId: string;
  },
) {
  await createNotification(executor, { ...params, type: "ASSIGNED" });
}

/**
 * Notify the task assignee that someone commented. No-op when the commenter
 * is the assignee, or when the task has no assignee.
 */
export async function createCommentNotification(
  executor: DbExecutor,
  {
    assigneeId,
    actorId,
    taskId,
  }: {
    assigneeId: string | null;
    actorId: string;
    taskId: string;
  },
) {
  if (!assigneeId) return;
  await createNotification(executor, {
    recipientId: assigneeId,
    actorId,
    taskId,
    type: "COMMENT",
  });
}

/**
 * Notify the task assignee that status changed. No-op when the actor is the
 * assignee, or when the task has no assignee.
 */
export async function createStatusChangeNotification(
  executor: DbExecutor,
  {
    assigneeId,
    actorId,
    taskId,
  }: {
    assigneeId: string | null;
    actorId: string;
    taskId: string;
  },
) {
  if (!assigneeId) return;
  await createNotification(executor, {
    recipientId: assigneeId,
    actorId,
    taskId,
    type: "STATUS_CHANGED",
  });
}

export async function cleanupExpiredNotifications(userId: string) {
  const cutoff = new Date(Date.now() - NOTIFICATION_RETENTION_MS);

  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.userId, userId),
        isNotNull(notifications.readAt),
        lt(notifications.readAt, cutoff),
      ),
    );
}

export async function getNotifications(
  userId: string,
  organizationId: string,
) {
  await cleanupExpiredNotifications(userId);

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
    .innerJoin(
      tasks,
      and(
        eq(notifications.taskId, tasks.id),
        eq(tasks.organizationId, organizationId),
      ),
    )
    .leftJoin(actor, eq(notifications.actorId, actor.id))
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt));

  return rows;
}

export function serializeNotification(
  row: Awaited<ReturnType<typeof getNotifications>>[number],
): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    read: row.readAt !== null,
    createdAt: toIsoString(row.createdAt),
    actor: row.actor?.id ? row.actor : null,
    task: row.task,
  };
}

export const getOrgNotifications = cache(() =>
  logServerCall("getOrgNotifications", async (): Promise<NotificationItem[]> => {
    const session = await getCurrentUser();
    if (!session) {
      return [];
    }

    const rows = await logServerCall("getOrgNotifications.query", () =>
      getNotifications(session.user.id, session.organization.id),
    );

    return rows.map(serializeNotification);
  }),
);

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
