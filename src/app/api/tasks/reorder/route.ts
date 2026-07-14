import { and, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireUserOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { createStatusChangeNotification } from "@/lib/notifications";
import { recordTaskStatusChange } from "@/lib/task-activity";
import {
  getOrganizationTask,
  getOrganizationTaskForUpdate,
} from "@/lib/task-access";
import { resolveCompletedAtUpdate } from "@/lib/task-visibility";
import { reorderTaskSchema, zodErrorResponse } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";

export const POST = withApiRoute("tasks.reorder", async (request: Request) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const body = await request.json();
  const parsed = reorderTaskSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { taskId, status, position } = parsed.data;
  const organizationId = session.organization.id;
  const inOrg = eq(tasks.organizationId, organizationId);

  let taskNotFound = false;

  await db.transaction(async (tx) => {
    const task = await getOrganizationTaskForUpdate(tx, organizationId, taskId);

    if (!task) {
      taskNotFound = true;
      return;
    }

    const oldStatus = task.status;
    const oldPosition = task.position;

    if (oldStatus === status) {
      if (position < oldPosition) {
        await tx
          .update(tasks)
          .set({ position: sql`${tasks.position} + 1` })
          .where(
            and(
              inOrg,
              eq(tasks.status, status),
              gte(tasks.position, position),
              lt(tasks.position, oldPosition),
            ),
          );
      } else if (position > oldPosition) {
        await tx
          .update(tasks)
          .set({ position: sql`${tasks.position} - 1` })
          .where(
            and(
              inOrg,
              eq(tasks.status, status),
              gt(tasks.position, oldPosition),
              lte(tasks.position, position),
            ),
          );
      }
    } else {
      await tx
        .update(tasks)
        .set({ position: sql`${tasks.position} - 1` })
        .where(
          and(
            inOrg,
            eq(tasks.status, oldStatus),
            gt(tasks.position, oldPosition),
          ),
        );

      await tx
        .update(tasks)
        .set({ position: sql`${tasks.position} + 1` })
        .where(
          and(
            inOrg,
            eq(tasks.status, status),
            gte(tasks.position, position),
          ),
        );
    }

    const completedAt = resolveCompletedAtUpdate(oldStatus, status);

    await tx
      .update(tasks)
      .set({
        status,
        position,
        ...(completedAt !== undefined ? { completedAt } : {}),
      })
      .where(and(eq(tasks.id, taskId), inOrg));

    if (oldStatus !== status) {
      await recordTaskStatusChange(tx, {
        taskId,
        userId: session.user.id,
        fromStatus: oldStatus,
        toStatus: status,
      });
      await createStatusChangeNotification(tx, {
        assigneeId: task.assigneeId,
        actorId: session.user.id,
        taskId,
      });
    }
  });

  if (taskNotFound) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const updated = await getOrganizationTask(organizationId, taskId);

  return NextResponse.json(updated);
});
