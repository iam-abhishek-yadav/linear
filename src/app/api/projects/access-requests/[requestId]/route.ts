import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { reviewProjectAccessRequest } from "@/lib/project-access-requests";
import { canManageMembers } from "@/lib/roles";
import { zodErrorResponse } from "@/lib/validations";

type RouteContext = { params: Promise<{ requestId: string }> };

const reviewSchema = z.object({
  action: z.enum(["approve", "deny"]),
});

export const PATCH = withApiRoute(
  "projects.accessRequests.review",
  async (request: Request, context: RouteContext) => {
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

    if (!canManageMembers(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { requestId } = await context.params;
    const body = await request.json();
    const parsed = reviewSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const result = await reviewProjectAccessRequest({
      organizationId: session.organization.id,
      requestId,
      actorId: session.user.id,
      actorRole: session.user.role,
      action: parsed.data.action,
    });

    if (result.error === "NOT_FOUND") {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (result.error === "NOT_PENDING") {
      return NextResponse.json(
        { error: "Request is no longer pending" },
        { status: 409 },
      );
    }

    if (result.error === "FORBIDDEN") {
      return NextResponse.json(
        {
          error:
            "Only admins can approve access requests from managers",
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ ok: true, status: result.status });
  },
);
