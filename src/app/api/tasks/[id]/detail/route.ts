import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { withDbRetry } from "@/lib/db";
import { getIssueDetailData } from "@/lib/issue-detail-data";
import { withApiRoute } from "@/lib/logger";
import {
  projectAccessDeniedResponse,
  resolveTaskViewerAccess,
} from "@/lib/task-viewer-access";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withApiRoute(
  "tasks.detail",
  async (_request: Request, context: RouteContext) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const { id } = await context.params;

  const access = await resolveTaskViewerAccess(
    session.organization.id,
    id,
    session.user.id,
  );

  if (access.status === "not_found") {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  if (access.status === "forbidden") {
    return projectAccessDeniedResponse(access.payload);
  }

  const data = await withDbRetry(() =>
    getIssueDetailData(session.organization.id, id, session.user.id),
  );

  if (!data) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(data);
  },
);
