import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { withDbRetry } from "@/lib/db";
import { getIssueTimelineData } from "@/lib/issue-timeline-data";
import { withApiRoute } from "@/lib/logger";
import { getOrganizationTask } from "@/lib/task-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiRoute(
  "tasks.timeline",
  async (_request: Request, context: RouteContext) => {
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

    const { id } = await context.params;
    const task = await getOrganizationTask(session.organization.id, id, session.user.id);
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const data = await withDbRetry(() => getIssueTimelineData(id));
    return NextResponse.json(data);
  },
);
