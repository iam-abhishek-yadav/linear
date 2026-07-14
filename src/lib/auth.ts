import { createId } from "@paralleldrive/cuid2";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { cache } from "react";
import { cookies } from "next/headers";
import { organizations, sessions, users } from "@/db/schema";
import { SESSION_COOKIE } from "@/lib/auth-constants";
import { db, withDbRetry } from "@/lib/db";
import { logServerCall } from "@/lib/logger";

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function slugifyOrgName(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createSession(userId: string) {
  const id = createId();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({ id, userId, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });

  return id;
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    cookieStore.delete(SESSION_COOKIE);
  }
}

export const getCurrentUser = cache(() =>
  logServerCall("getCurrentUser", async () => {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

    if (!sessionId) {
      return null;
    }

    const [result] = await withDbRetry(() =>
      db
        .select({
          user: users,
          organization: organizations,
          session: sessions,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .innerJoin(organizations, eq(users.organizationId, organizations.id))
        .where(eq(sessions.id, sessionId))
        .limit(1),
    );

    if (!result) {
      return null;
    }

    if (result.session.expiresAt < new Date()) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      return null;
    }

    const { passwordHash: _, ...user } = result.user;

    return {
      user,
      organization: result.organization,
    };
  }),
);

export async function requireUser() {
  const session = await getCurrentUser();
  if (!session) {
    return null;
  }
  return session;
}

export async function requireAdmin() {
  const session = await requireUser();
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

/** Admin or manager — for members invites and the members settings page. */
export async function requireMemberManager() {
  const session = await requireUser();
  if (
    !session ||
    (session.user.role !== "ADMIN" && session.user.role !== "MANAGER")
  ) {
    return null;
  }
  return session;
}
