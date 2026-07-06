import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { tasks } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTaskActivities } from "@/lib/task-activity";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const [task] = await db.select({ id: tasks.id }).from(tasks).where(eq(tasks.id, id));

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const activities = await getTaskActivities(id);

  return NextResponse.json(
    activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      fromStatus: activity.fromStatus,
      toStatus: activity.toStatus,
      createdAt: activity.createdAt.toISOString(),
      user: activity.user,
    })),
  );
}
