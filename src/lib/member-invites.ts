import { and, eq, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { memberInvites } from "@/db/schema";
import { db } from "@/lib/db";
import {
  generateInviteToken,
  getAppUrl,
  INVITE_DURATION_MS,
  logInviteCreated,
} from "@/lib/invite-utils";

export function getMemberInviteUrl(token: string) {
  return `${getAppUrl()}/join/${token}`;
}

export async function createMemberInvite({
  organizationId,
  email,
  invitedByUserId,
}: {
  organizationId: string;
  email: string;
  invitedByUserId: string;
}) {
  const id = createId();
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_DURATION_MS);
  const normalizedEmail = email.toLowerCase().trim();

  await db.insert(memberInvites).values({
    id,
    organizationId,
    token,
    email: normalizedEmail,
    invitedByUserId,
    expiresAt,
  });

  const inviteUrl = getMemberInviteUrl(token);

  logInviteCreated({
    type: "member",
    email: normalizedEmail,
    expiresAt,
    inviteUrl,
  });

  return { id, token, email: normalizedEmail, expiresAt, inviteUrl };
}

export async function getValidMemberInvite(token: string) {
  const [invite] = await db
    .select()
    .from(memberInvites)
    .where(
      and(eq(memberInvites.token, token), isNull(memberInvites.acceptedAt)),
    )
    .limit(1);

  if (!invite || invite.expiresAt < new Date()) {
    return null;
  }

  return invite;
}
