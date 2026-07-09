import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { withDbRetry } from "@/lib/db";
import { getIssueDetailData } from "@/lib/issue-detail-data";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const data = await withDbRetry(() =>
    getIssueDetailData(session.organization.id, id),
  );

  if (!data) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}
