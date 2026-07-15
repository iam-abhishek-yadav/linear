import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { requestProjectAccess } from "@/lib/project-access-requests";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiRoute(
  "projects.accessRequests.create",
  async (_request: Request, context: RouteContext) => {
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;
    const { id: projectId } = await context.params;

    const result = await requestProjectAccess({
      organizationId: session.organization.id,
      projectId,
      userId: session.user.id,
    });

    if (result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (result.error === "ALREADY_MEMBER") {
      return NextResponse.json(
        { error: "You are already a member of this project" },
        { status: 409 },
      );
    }

    return NextResponse.json({ request: result.request }, { status: 201 });
  },
);
