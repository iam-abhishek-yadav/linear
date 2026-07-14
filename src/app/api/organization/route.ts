import { NextResponse } from "next/server";
import { deleteSession, requireAdmin } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import {
  deleteOrganization,
  updateOrganizationName,
} from "@/lib/organization";
import { updateOrganizationSchema } from "@/lib/validations";

export const PATCH = withApiRoute(
  "organization.update",
  async (request: Request) => {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const organization = await updateOrganizationName(
      session.organization.id,
      parsed.data.name,
    );

    return NextResponse.json({
      organization: {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        createdAt: organization.createdAt.toISOString(),
        updatedAt: organization.updatedAt.toISOString(),
      },
    });
  },
);

export const DELETE = withApiRoute("organization.delete", async () => {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deleteOrganization(session.organization.id);
  await deleteSession();

  return NextResponse.json({ success: true });
});
