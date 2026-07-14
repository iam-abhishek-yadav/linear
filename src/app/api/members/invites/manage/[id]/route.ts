import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { memberInvites } from "@/db/schema";
import { requireMemberManagerOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { withApiRoute } from "@/lib/logger";

export const DELETE = withApiRoute(
  "members.invites.revoke",
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
  const guard = await requireMemberManagerOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const { id } = await params;

  const [invite] = await db
    .select({ id: memberInvites.id })
    .from(memberInvites)
    .where(
      and(
        eq(memberInvites.id, id),
        eq(memberInvites.organizationId, session.organization.id),
        isNull(memberInvites.acceptedAt),
      ),
    )
    .limit(1);

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  await db.delete(memberInvites).where(eq(memberInvites.id, id));

  return NextResponse.json({ success: true });
  },
);
