import { NextResponse } from "next/server";
import {
  requireMemberManagerOrResponse,
  requireUserOrResponse,
} from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import {
  deleteOrgProject,
  getOrgProject,
  updateOrgProject,
} from "@/lib/projects";
import { updateProjectSchema } from "@/lib/project-validations";
import { zodErrorResponse } from "@/lib/validations";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiRoute(
  "projects.get",
  async (_request: Request, context: RouteContext) => {
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;
    const { id } = await context.params;

    const project = await getOrgProject(
      session.organization.id,
      id,
      session.user.id,
    );
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  },
);

export const PATCH = withApiRoute(
  "projects.update",
  async (request: Request, context: RouteContext) => {
    const guard = await requireMemberManagerOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;
    const { id } = await context.params;

    const body = await request.json();
    const parsed = updateProjectSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    try {
      const project = await updateOrgProject({
        organizationId: session.organization.id,
        projectId: id,
        name: parsed.data.name,
        description: parsed.data.description,
      });

      if (!project) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 });
      }

      return NextResponse.json({ project });
    } catch (error) {
      if (error instanceof Error && error.message === "DUPLICATE_PROJECT") {
        return NextResponse.json(
          { error: { name: ["A project with this name already exists"] } },
          { status: 409 },
        );
      }
      throw error;
    }
  },
);

export const DELETE = withApiRoute(
  "projects.delete",
  async (_request: Request, context: RouteContext) => {
    const guard = await requireMemberManagerOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;
    const { id } = await context.params;

    const deleted = await deleteOrgProject(session.organization.id, id);
    if (!deleted) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  },
);
