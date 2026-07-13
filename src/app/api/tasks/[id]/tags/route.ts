import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { getOrganizationTask } from "@/lib/task-access";
import { setTaskTags } from "@/lib/tags";
import { setTaskTagsSchema } from "@/lib/tag-validations";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const PUT = withApiRoute(
  "tasks.tags.set",
  async (request: Request, context: RouteContext) => {
    const session = await requireUser();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await getOrganizationTask(session.organization.id, id);

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = setTaskTagsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
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
