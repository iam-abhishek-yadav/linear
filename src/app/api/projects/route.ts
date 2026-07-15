import { NextResponse } from "next/server";
import {
  requireMemberManagerOrResponse,
  requireUserOrResponse,
} from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { createOrgProject, listOrgProjects } from "@/lib/projects";
import { createProjectSchema } from "@/lib/project-validations";
import { zodErrorResponse } from "@/lib/validations";

export const GET = withApiRoute("projects.list", async () => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const projects = await listOrgProjects(session.organization.id);
  return NextResponse.json({ projects });
});

export const POST = withApiRoute("projects.create", async (request: Request) => {
  const guard = await requireMemberManagerOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const body = await request.json();
  const parsed = createProjectSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  try {
    const project = await createOrgProject({
      organizationId: session.organization.id,
      name: parsed.data.name,
      description: parsed.data.description,
      memberIds: parsed.data.memberIds,
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_PROJECT") {
      return NextResponse.json(
        { error: { name: ["A project with this name already exists"] } },
        { status: 409 },
      );
    }
    if (error instanceof Error && error.message === "INVALID_PROJECT_MEMBERS") {
      return NextResponse.json(
        { error: { memberIds: ["One or more members are invalid"] } },
        { status: 400 },
      );
    }
    throw error;
  }
});
