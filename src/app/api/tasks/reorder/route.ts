import { and, eq, gt, gte, lt, lte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { db } from "@/lib/db";
import { reorderTaskSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = reorderTaskSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { taskId, status, position } = parsed.data;

  const [task] = await db.select().from(tasks).where(eq(tasks.id, taskId));

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const oldStatus = task.status;
  const oldPosition = task.position;

  await db.transaction(async (tx) => {
    if (oldStatus === status) {
      if (position < oldPosition) {
        await tx
          .update(tasks)
          .set({ position: sql`${tasks.position} + 1` })
          .where(
            and(
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
          and(eq(tasks.status, oldStatus), gt(tasks.position, oldPosition)),
        );

      await tx
        .update(tasks)
        .set({ position: sql`${tasks.position} + 1` })
        .where(
          and(eq(tasks.status, status), gte(tasks.position, position)),
        );
    }

    await tx
      .update(tasks)
      .set({ status, position })
      .where(eq(tasks.id, taskId));
  });

  const [updated] = await db.select().from(tasks).where(eq(tasks.id, taskId));

  return NextResponse.json(updated);
}
