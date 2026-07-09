import { and, asc, eq, max } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createAssignmentNotification } from "@/lib/notifications";
import { recordTaskCreated } from "@/lib/task-activity";
import { isAssigneeInOrganization } from "@/lib/task-access";
import { createTaskSchema } from "@/lib/validations";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.organizationId, session.organization.id))
    .orderBy(asc(tasks.status), asc(tasks.position));

  return NextResponse.json(allTasks);
}

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const organizationId = session.organization.id;
  const status = parsed.data.status ?? "BACKLOG";
  const assigneeId = parsed.data.assigneeId ?? null;

  const assigneeOk = await isAssigneeInOrganization(
    assigneeId,
    organizationId,
  );
  if (!assigneeOk) {
    return NextResponse.json(
      { error: "Assignee must be a member of your organization" },
      { status: 400 },
    );
  }

  const [maxPos] = await db
    .select({ value: max(tasks.position) })
    .from(tasks)
    .where(
      and(eq(tasks.organizationId, organizationId), eq(tasks.status, status)),
    );

  const now = new Date();
  const taskId = createId();

  const [task] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(tasks)
      .values({
        id: taskId,
        organizationId,
        title: parsed.data.title,
        description: parsed.data.description,
        status,
        priority: parsed.data.priority ?? "NONE",
        position: (maxPos?.value ?? -1) + 1,
        assigneeId,
        dueDate: parsed.data.dueDate ?? null,
        completedAt: status === "DONE" ? now : null,
        createdById: session.user.id,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    await recordTaskCreated(tx, {
      taskId,
      userId: session.user.id,
      status,
    });

    if (created.assigneeId) {
      await createAssignmentNotification(tx, {
        recipientId: created.assigneeId,
        actorId: session.user.id,
        taskId,
      });
    }

    return [created];
  });

  return NextResponse.json(task, { status: 201 });
}
