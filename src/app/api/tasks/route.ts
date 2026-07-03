import { asc, eq, max } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { db } from "@/lib/db";
import { createTaskSchema } from "@/lib/validations";

export async function GET() {
  const allTasks = await db
    .select()
    .from(tasks)
    .orderBy(asc(tasks.status), asc(tasks.position));

  return NextResponse.json(allTasks);
}

export async function POST(request: Request) {
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

  const [task] = await db
    .insert(tasks)
    .values({
      id: createId(),
      title: parsed.data.title,
      description: parsed.data.description,
      status,
      priority: parsed.data.priority ?? "NONE",
      position: (maxPos?.value ?? -1) + 1,
      createdAt: now,
      updatedAt: now,
    })
    .returning();

  return NextResponse.json(task, { status: 201 });
}
