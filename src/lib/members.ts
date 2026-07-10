import { and, asc, eq, isNull } from "drizzle-orm";
import { cache } from "react";
import { memberInvites, users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { logServerCall } from "@/lib/logger";
import { getMemberInviteUrl } from "@/lib/member-invites";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isCurrentUser: boolean;
};

export type MemberWithMeta = Member & {
  createdAt: string;
};

export type PendingInvite = {
  id: string;
  email: string;
  inviteUrl: string;
  createdAt: string;
  expiresAt: string;
};

export type MembersPageData = {
  members: MemberWithMeta[];
  pendingInvites: PendingInvite[];
};

async function fetchOrgMembers(
  organizationId: string,
  currentUserId: string,
): Promise<Member[]> {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
    .orderBy(asc(users.createdAt));

  return rows.map((member) => ({
    ...member,
    isCurrentUser: member.id === currentUserId,
  }));
}

export const getOrgMembers = cache(() =>
  logServerCall("getOrgMembers", async () => {
    const session = await getCurrentUser();
    if (!session) {
      return [];
    }

    return logServerCall("getOrgMembers.query", () =>
      fetchOrgMembers(session.organization.id, session.user.id),
    );
  }),
);

async function fetchMembersPageData(
  organizationId: string,
  currentUserId: string,
  isAdmin: boolean,
): Promise<MembersPageData> {
  const memberRows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.organizationId, organizationId))
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
            eq(memberInvites.organizationId, organizationId),
            isNull(memberInvites.acceptedAt),
          ),
        )
        .orderBy(asc(memberInvites.createdAt))
    : [];

  return {
    members: memberRows.map((member) => ({
      id: member.id,
      name: member.name,
      email: member.email,
      role: member.role,
      createdAt: member.createdAt.toISOString(),
      isCurrentUser: member.id === currentUserId,
    })),
    pendingInvites: pendingInvites.map((invite) => ({
      id: invite.id,
      email: invite.email,
      inviteUrl: getMemberInviteUrl(invite.token),
      createdAt: invite.createdAt.toISOString(),
      expiresAt: invite.expiresAt.toISOString(),
    })),
  };
}

export const getMembersPageData = cache(() =>
  logServerCall("getMembersPageData", async (): Promise<MembersPageData> => {
    const session = await getCurrentUser();
    if (!session) {
      return { members: [], pendingInvites: [] };
    }

    return logServerCall("getMembersPageData.query", () =>
      fetchMembersPageData(
        session.organization.id,
        session.user.id,
        session.user.role === "ADMIN",
      ),
    );
  }),
);
