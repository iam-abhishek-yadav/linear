import { NextResponse } from "next/server";
import { getValidOrgInvite } from "@/lib/invites";
import { createOrganizationWithAdmin } from "@/lib/registration";
import { bootstrapRegisterSchema, registerSchema } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";

export const POST = withApiRoute("auth.register", async (request: Request) => {
  const body = await request.json();

  if (body.token) {
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { token, orgName, name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase();
    const invite = await getValidOrgInvite(token);

    if (!invite) {
      return NextResponse.json(
        { error: { token: ["This invite is invalid or has expired"] } },
        { status: 400 },
      );
    }

    if (invite.email && invite.email !== normalizedEmail) {
      return NextResponse.json(
        { error: { email: ["This invite is for a different email address"] } },
        { status: 400 },
      );
    }

    const result = await createOrganizationWithAdmin(
      { orgName, name, email, password },
      invite,
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: { email: ["An account with this email already exists"] } },
        { status: 409 },
      );
    }

    return NextResponse.json(result, { status: 201 });
  }

  const parsed = bootstrapRegisterSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await createOrganizationWithAdmin(parsed.data);

  if ("error" in result) {
    return NextResponse.json(
      { error: { email: ["An account with this email already exists"] } },
      { status: 409 },
    );
  }

  return NextResponse.json(result, { status: 201 });
});
