import { NextResponse } from "next/server";
import { getValidOrgInvite } from "@/lib/invites";
import { withApiRoute } from "@/lib/logger";

export const GET = withApiRoute(
  "invites.get",
  async (
    _request: Request,
    { params }: { params: Promise<{ token: string }> },
  ) => {
  const { token } = await params;
  const invite = await getValidOrgInvite(token);

  if (!invite) {
    return NextResponse.json(
      { error: "This invite is invalid or has expired" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    email: invite.email,
    expiresAt: invite.expiresAt.toISOString(),
  });
  },
);
