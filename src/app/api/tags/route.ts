import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { createOrgTag, getOrgTags } from "@/lib/tags";
import { createTagSchema } from "@/lib/tag-validations";

export const GET = withApiRoute("tags.list", async () => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await getOrgTags(session.organization.id);
  return NextResponse.json({ tags });
});

export const POST = withApiRoute("tags.create", async (request: Request) => {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTagSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
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
