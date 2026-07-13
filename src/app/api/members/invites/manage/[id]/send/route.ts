import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { memberInvites, users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { isEmailConfigured, sendMemberInviteEmail } from "@/lib/email";
import { withApiRoute } from "@/lib/logger";
import { getMemberInviteUrl } from "@/lib/member-invites";

export const POST = withApiRoute(
  "members.invites.sendEmail",
  async (
    _request: Request,
    { params }: { params: Promise<{ id: string }> },
  ) => {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!isEmailConfigured()) {
      return NextResponse.json(
        { error: "Email is not configured on this server" },
        { status: 503 },
      );
    }

    const { id } = await params;

    const [invite] = await db
      .select({
        id: memberInvites.id,
        email: memberInvites.email,
        token: memberInvites.token,
        expiresAt: memberInvites.expiresAt,
        invitedByName: users.name,
      })
      .from(memberInvites)
      .innerJoin(users, eq(memberInvites.invitedByUserId, users.id))
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

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
    }

    try {
      await sendMemberInviteEmail({
        to: invite.email,
        inviteUrl: getMemberInviteUrl(invite.token),
        organizationName: session.organization.name,
        inviterName: invite.invitedByName,
        expiresAt: invite.expiresAt,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to send invite email";

      return NextResponse.json({ error: message }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  },
);
