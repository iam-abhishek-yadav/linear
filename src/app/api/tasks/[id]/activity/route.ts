import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getTaskActivities } from "@/lib/task-activity";
import { getOrganizationTask } from "@/lib/task-access";
import { withApiRoute } from "@/lib/logger";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiRoute(
  "tasks.activity",
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

  const activities = await getTaskActivities(id);

  return NextResponse.json(
    activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      fromStatus: activity.fromStatus,
      toStatus: activity.toStatus,
      fromPriority: activity.fromPriority,
      toPriority: activity.toPriority,
      fromDueDate: activity.fromDueDate?.toISOString() ?? null,
      toDueDate: activity.toDueDate?.toISOString() ?? null,
      fromAssignee: activity.fromAssignee,
      toAssignee: activity.toAssignee,
      createdAt: activity.createdAt.toISOString(),
      user: activity.user,
    })),
  );
  },
);
