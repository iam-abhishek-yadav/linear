import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  createAssignmentNotification,
  createStatusChangeNotification,
} from "@/lib/notifications";
import {
  recordTaskAssigneeChange,
  recordTaskDueDateChange,
  recordTaskPriorityChange,
  recordTaskStatusChange,
} from "@/lib/task-activity";
import {
  getOrganizationTask,
  isAssigneeInOrganization,
} from "@/lib/task-access";
import { resolveCompletedAtUpdate } from "@/lib/task-visibility";
import { updateTaskSchema } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiRoute(
  "tasks.get",
  async (_request: Request, context: RouteContext) => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const task = await getOrganizationTask(session.organization.id, id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
  },
);

export const PATCH = withApiRoute(
  "tasks.update",
  async (request: Request, context: RouteContext) => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const organizationId = session.organization.id;
  const existing = await getOrganizationTask(organizationId, id);

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (parsed.data.assigneeId !== undefined) {
    const assigneeOk = await isAssigneeInOrganization(
      parsed.data.assigneeId,
      organizationId,
    );
    if (!assigneeOk) {
      return NextResponse.json(
        { error: "Assignee must be a member of your organization" },
        { status: 400 },
      );
    }
  }

  const nextStatus = parsed.data.status ?? existing.status;
  const nextPriority = parsed.data.priority ?? existing.priority;
  const nextAssigneeId =
    parsed.data.assigneeId !== undefined
      ? parsed.data.assigneeId
      : existing.assigneeId;
  const nextDueDate =
    parsed.data.dueDate !== undefined ? parsed.data.dueDate : existing.dueDate;
  const completedAt = resolveCompletedAtUpdate(existing.status, nextStatus);
  const updatePayload = {
    ...parsed.data,
    ...(completedAt !== undefined ? { completedAt } : {}),
  };

  const [task] = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(tasks)
      .set(updatePayload)
      .where(
        and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)),
      )
      .returning();

    const actorId = session.user.id;

    if (parsed.data.status && parsed.data.status !== existing.status) {
      await recordTaskStatusChange(tx, {
        taskId: id,
        userId: actorId,
        fromStatus: existing.status,
        toStatus: nextStatus,
      });
      await createStatusChangeNotification(tx, {
        assigneeId: nextAssigneeId,
        actorId,
        taskId: id,
      });
    }

    const assigneeChanged =
      parsed.data.assigneeId !== undefined &&
      parsed.data.assigneeId !== existing.assigneeId;

    if (assigneeChanged) {
      await recordTaskAssigneeChange(tx, {
        taskId: id,
        userId: actorId,
        fromAssigneeId: existing.assigneeId,
        toAssigneeId: parsed.data.assigneeId ?? null,
      });

      if (parsed.data.assigneeId) {
        await createAssignmentNotification(tx, {
          recipientId: parsed.data.assigneeId,
          actorId,
          taskId: id,
        });
      }
    }

    if (parsed.data.priority && parsed.data.priority !== existing.priority) {
      await recordTaskPriorityChange(tx, {
        taskId: id,
        userId: actorId,
        fromPriority: existing.priority,
        toPriority: nextPriority,
      });
    }

    if (parsed.data.dueDate !== undefined) {
      await recordTaskDueDateChange(tx, {
        taskId: id,
        userId: actorId,
        fromDueDate: existing.dueDate,
        toDueDate: nextDueDate ?? null,
      });
    }

    return [updated];
  });

  return NextResponse.json(task);
  },
);

export const DELETE = withApiRoute(
  "tasks.delete",
  async (_request: Request, context: RouteContext) => {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;
  const organizationId = session.organization.id;

  const existing = await getOrganizationTask(organizationId, id);

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.organizationId, organizationId)));

  return NextResponse.json({ success: true });
  },
);
