import { NextResponse } from "next/server";
import { deleteSession, requireAdminOrResponse } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import {
  deleteOrganization,
  updateOrganizationName,
} from "@/lib/organization";
import { updateOrganizationSchema, zodErrorResponse } from "@/lib/validations";

export const PATCH = withApiRoute(
  "organization.update",
  async (request: Request) => {
    const guard = await requireAdminOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

    const body = await request.json();
    const parsed = updateOrganizationSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
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
  const guard = await requireAdminOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  await deleteOrganization(session.organization.id);
  await deleteSession();

  return NextResponse.json({ success: true });
});
