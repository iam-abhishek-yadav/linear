import { randomBytes } from "crypto";
import { getEnv } from "@/lib/env";

export const INVITE_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export function generateInviteToken() {
  return randomBytes(32).toString("base64url");
}

export function getAppUrl() {
  return getEnv().APP_URL;
}

export function logInviteCreated({
  type,
  email,
  expiresAt,
  inviteUrl,
}: {
  type: "org" | "member";
  email: string;
  expiresAt: Date;
  inviteUrl: string;
}) {
  const label = type === "org" ? "Org invite" : "Member invite";

  console.log(`\n--- ${label} created ---`);
  console.log(`Email: ${email}`);
  console.log(`Expires: ${expiresAt.toISOString()}`);
  console.log(`Invite URL: ${inviteUrl}`);
  console.log(`${"-".repeat(label.length + 18)}\n`);
}
