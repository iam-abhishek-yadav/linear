import { NextResponse } from "next/server";
import { requireUserOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { createOrgTag, getOrgTags } from "@/lib/tags";
import { createTagSchema } from "@/lib/tag-validations";
import { zodErrorResponse } from "@/lib/validations";

export const GET = withApiRoute("tags.list", async () => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const tags = await getOrgTags(session.organization.id);
  return NextResponse.json({ tags });
});

export const POST = withApiRoute("tags.create", async (request: Request) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const body = await request.json();
  const parsed = createTagSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  try {
    const tag = await createOrgTag({
      organizationId: session.organization.id,
      name: parsed.data.name,
      color: parsed.data.color,
    });

    return NextResponse.json({ tag }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_TAG") {
      return NextResponse.json(
        { error: { name: ["A label with this name already exists"] } },
        { status: 409 },
      );
    }

    throw error;
  }
});
