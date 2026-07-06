import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
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

  const [task] = await db
    .update(tasks)
    .set(parsed.data)
    .where(eq(tasks.id, id))
    .returning();

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
