import { createId } from "@paralleldrive/cuid2";
import { asc, eq, inArray } from "drizzle-orm";
import {
  taskActivities,
  users,
  type TaskPriority,
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

export async function recordTaskAssigneeChange(
  executor: DbExecutor,
  {
    taskId,
    userId,
    fromAssigneeId,
    toAssigneeId,
  }: {
    taskId: string;
    userId: string;
    fromAssigneeId: string | null;
    toAssigneeId: string | null;
  },
) {
  if (fromAssigneeId === toAssigneeId) return;

  await executor.insert(taskActivities).values({
    id: createId(),
    taskId,
    userId,
    type: "ASSIGNEE_CHANGED",
    fromAssigneeId,
    toAssigneeId,
  });
}

export async function recordTaskPriorityChange(
  executor: DbExecutor,
  {
    taskId,
    userId,
    fromPriority,
    toPriority,
  }: {
    taskId: string;
    userId: string;
    fromPriority: TaskPriority;
    toPriority: TaskPriority;
  },
) {
  if (fromPriority === toPriority) return;

  await executor.insert(taskActivities).values({
    id: createId(),
    taskId,
    userId,
    type: "PRIORITY_CHANGED",
    fromPriority,
    toPriority,
  });
}

function sameDueDate(a: Date | null, b: Date | null) {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.getTime() === b.getTime();
}

export async function recordTaskDueDateChange(
  executor: DbExecutor,
  {
    taskId,
    userId,
    fromDueDate,
    toDueDate,
  }: {
    taskId: string;
    userId: string;
    fromDueDate: Date | null;
    toDueDate: Date | null;
  },
) {
  if (sameDueDate(fromDueDate, toDueDate)) return;

  await executor.insert(taskActivities).values({
    id: createId(),
    taskId,
    userId,
    type: "DUE_DATE_CHANGED",
    fromDueDate,
    toDueDate,
  });
}

type NamedUser = { id: string; name: string };

async function loadUserMap(ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map<string, NamedUser>();

  const rows = await db
    .select({ id: users.id, name: users.name })
    .from(users)
    .where(inArray(users.id, unique));

  return new Map(rows.map((row) => [row.id, row]));
}

export async function getTaskActivities(taskId: string) {
  const rows = await db
    .select({
      id: taskActivities.id,
      type: taskActivities.type,
      fromStatus: taskActivities.fromStatus,
      toStatus: taskActivities.toStatus,
      fromPriority: taskActivities.fromPriority,
      toPriority: taskActivities.toPriority,
      fromAssigneeId: taskActivities.fromAssigneeId,
      toAssigneeId: taskActivities.toAssigneeId,
      fromDueDate: taskActivities.fromDueDate,
      toDueDate: taskActivities.toDueDate,
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

  const userMap = await loadUserMap(
    rows.flatMap((row) => [row.fromAssigneeId, row.toAssigneeId]),
  );

  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    fromStatus: row.fromStatus,
    toStatus: row.toStatus,
    fromPriority: row.fromPriority,
    toPriority: row.toPriority,
    fromDueDate: row.fromDueDate,
    toDueDate: row.toDueDate,
    createdAt: row.createdAt,
    user: row.user,
    fromAssignee: row.fromAssigneeId
      ? (userMap.get(row.fromAssigneeId) ?? null)
      : null,
    toAssignee: row.toAssigneeId
      ? (userMap.get(row.toAssigneeId) ?? null)
      : null,
  }));
}
