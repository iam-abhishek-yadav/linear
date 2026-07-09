import { and, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createStatusChangeNotification } from "@/lib/notifications";
import { recordTaskStatusChange } from "@/lib/task-activity";
import { getOrganizationTask } from "@/lib/task-access";
import { resolveCompletedAtUpdate } from "@/lib/task-visibility";
import { reorderTaskSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = reorderTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { taskId, status, position } = parsed.data;
  const organizationId = session.organization.id;

  const task = await getOrganizationTask(organizationId, taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const oldStatus = task.status;
  const oldPosition = task.position;
  const inOrg = eq(tasks.organizationId, organizationId);

  await db.transaction(async (tx) => {
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

  const updated = await getOrganizationTask(organizationId, taskId);

  return NextResponse.json(updated);
}
