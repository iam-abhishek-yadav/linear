import { and, eq, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { orgInvites } from "@/db/schema";
import { db } from "@/lib/db";
import {
  generateInviteToken,
  getAppUrl,
  INVITE_DURATION_MS,
  logInviteCreated,
} from "@/lib/invite-utils";

export function getOrgInviteUrl(token: string) {
  return `${getAppUrl()}/register/${token}`;
}

export async function createOrgInvite(email?: string) {
  const id = createId();
  const token = generateInviteToken();
  const expiresAt = new Date(Date.now() + INVITE_DURATION_MS);
  const normalizedEmail = email?.toLowerCase().trim() || null;

  await db.insert(orgInvites).values({
    id,
    token,
    email: normalizedEmail,
    expiresAt,
  });

  const inviteUrl = getOrgInviteUrl(token);

  logInviteCreated({
    type: "org",
    email: normalizedEmail ?? "(any)",
    expiresAt,
    inviteUrl,
  });

  return { id, token, email: normalizedEmail, expiresAt, inviteUrl };
}

export async function getValidOrgInvite(token: string) {
  const [invite] = await db
    .select()
    .from(orgInvites)
    .where(
      and(eq(orgInvites.token, token), isNull(orgInvites.acceptedAt)),
    )
    .limit(1);

  if (!invite || invite.expiresAt < new Date()) {
    return null;
  }

  return invite;
}
