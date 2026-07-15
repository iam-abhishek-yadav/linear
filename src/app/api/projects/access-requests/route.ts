import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { listPendingAccessRequests } from "@/lib/project-access-requests";
import { canManageMembers } from "@/lib/roles";

export const GET = withApiRoute("projects.accessRequests.list", async () => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  if (!canManageMembers(session.user.role)) {
    return NextResponse.json({ requests: [] });
  }

  const requests = await listPendingAccessRequests(
    session.organization.id,
    session.user.role,
  );

  return NextResponse.json({ requests });
});
