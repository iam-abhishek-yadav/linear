import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { organizations } from "@/db/schema";
import { db } from "@/lib/db";
import { getValidMemberInvite } from "@/lib/member-invites";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invite = await getValidMemberInvite(token);

  if (!invite) {
    return NextResponse.json(
      { error: "This invite is invalid or has expired" },
      { status: 404 },
    );
  }

  const [organization] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, invite.organizationId))
    .limit(1);

  if (!organization) {
    return NextResponse.json(
      { error: "This invite is invalid or has expired" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    email: invite.email,
    organization,
    expiresAt: invite.expiresAt.toISOString(),
  });
}
