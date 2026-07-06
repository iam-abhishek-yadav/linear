import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { recordTaskStatusChange } from "@/lib/task-activity";
import { updateTaskSchema } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const [task] = await db.select().from(tasks).where(eq(tasks.id, id));

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(request: Request, context: RouteContext) {
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

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const nextStatus = parsed.data.status ?? existing.status;

  const [task] = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(tasks)
      .set(parsed.data)
      .where(eq(tasks.id, id))
      .returning();

    if (parsed.data.status && parsed.data.status !== existing.status) {
      await recordTaskStatusChange(tx, {
        taskId: id,
        userId: session.user.id,
        fromStatus: existing.status,
        toStatus: nextStatus,
      });
    }

    return [updated];
  });

  return NextResponse.json(task);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const { id } = await context.params;

  const [existing] = await db.select().from(tasks).where(eq(tasks.id, id));

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db.delete(tasks).where(eq(tasks.id, id));

  return NextResponse.json({ success: true });
}
