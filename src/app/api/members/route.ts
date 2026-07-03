import { and, asc, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { memberInvites, users } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getMemberInviteUrl } from "@/lib/member-invites";

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";

  const members = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.organizationId, session.organization.id))
    .orderBy(asc(users.createdAt));

  const pendingInvites = isAdmin
    ? await db
        .select({
          id: memberInvites.id,
          email: memberInvites.email,
          token: memberInvites.token,
          createdAt: memberInvites.createdAt,
          expiresAt: memberInvites.expiresAt,
        })
        .from(memberInvites)
        .where(
          and(
            eq(memberInvites.organizationId, session.organization.id),
            isNull(memberInvites.acceptedAt),
          ),
        )
        .orderBy(asc(memberInvites.createdAt))
    : [];

  return NextResponse.json({
    members: members.map((member) => ({
      ...member,
      createdAt: member.createdAt.toISOString(),
      isCurrentUser: member.id === session.user.id,
    })),
    pendingInvites: pendingInvites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      inviteUrl: getMemberInviteUrl(invite.token),
      createdAt: invite.createdAt.toISOString(),
      expiresAt: invite.expiresAt.toISOString(),
    })),
  });
}
