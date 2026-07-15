import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { getOrganizationTask } from "@/lib/task-access";
import { setTaskTags } from "@/lib/tags";
import { setTaskTagsSchema } from "@/lib/tag-validations";
import { zodErrorResponse } from "@/lib/validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const PUT = withApiRoute(
  "tasks.tags.set",
  async (request: Request, context: RouteContext) => {
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

    const { id } = await context.params;
    const existing = await getOrganizationTask(session.organization.id, id, session.user.id);

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = setTaskTagsSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    try {
      const tags = await setTaskTags({
        organizationId: session.organization.id,
        taskId: id,
        tagIds: parsed.data.tagIds,
      });

      return NextResponse.json({ tags });
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid tag selection") {
        return NextResponse.json({ error: "Invalid label selection" }, { status: 400 });
      }

      throw error;
    }
  },
);
