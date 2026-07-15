import { NextResponse } from "next/server";
import { requireMemberManagerOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { setProjectMembers } from "@/lib/projects";
import { setProjectMembersSchema } from "@/lib/project-validations";
import { zodErrorResponse } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = withApiRoute(
  "projects.members.set",
  async (request: Request, context: RouteContext) => {
    const guard = await requireMemberManagerOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;
    const { id } = await context.params;

    const body = await request.json();
    const parsed = setProjectMembersSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    try {
      const project = await setProjectMembers({
        organizationId: session.organization.id,
        projectId: id,
        memberIds: parsed.data.memberIds,
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      return NextResponse.json({ project });
    } catch (error) {
      if (error instanceof Error && error.message === "INVALID_PROJECT_MEMBERS") {
        return NextResponse.json(
          { error: { memberIds: ["One or more members are invalid"] } },
          { status: 400 },
        );
      }
      throw error;
    }
  },
);
