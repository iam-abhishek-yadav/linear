import { asc, eq, max } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordTaskCreated } from "@/lib/task-activity";
import { createTaskSchema } from "@/lib/validations";

export async function GET() {
  const allTasks = await db
    .select()
    .from(tasks)
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

  const status = parsed.data.status ?? "BACKLOG";

  const [maxPos] = await db
    .select({ value: max(tasks.position) })
    .from(tasks)
    .where(eq(tasks.status, status));

  const now = new Date();
  const taskId = createId();

  const [task] = await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(tasks)
      .values({
        id: taskId,
        title: parsed.data.title,
        description: parsed.data.description,
        status,
        priority: parsed.data.priority ?? "NONE",
        position: (maxPos?.value ?? -1) + 1,
        assigneeId: parsed.data.assigneeId ?? null,
        dueDate: parsed.data.dueDate ?? null,
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

    return [created];
  });

  return NextResponse.json(task, { status: 201 });
}
