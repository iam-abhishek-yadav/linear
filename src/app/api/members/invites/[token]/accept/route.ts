import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { memberInvites, users } from "@/db/schema";
import {
  createSession,
  hashPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { getValidMemberInvite } from "@/lib/member-invites";
import { acceptMemberInviteSchema } from "@/lib/member-validations";
import { zodErrorResponse } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = withApiRoute(
  "members.invites.accept",
  async (
    request: Request,
    { params }: { params: Promise<{ token: string }> },
  ) => {
  const { token } = await params;
  const body = await request.json();
  const parsed = acceptMemberInviteSchema.safeParse({ ...body, token });

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const rateLimit = checkRateLimit(`member-invite-accept:${token}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { form: ["Too many attempts. Try again later."] } },
      { status: 429 },
    );
  }

  const invite = await getValidMemberInvite(token);

  if (!invite) {
    return NextResponse.json(
      { error: { token: ["This invite is invalid or has expired"] } },
      { status: 400 },
    );
  }

  if (invite.email !== normalizedEmail) {
    return NextResponse.json(
      { error: { email: ["This invite is for a different email address"] } },
      { status: 400 },
    );
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: { email: ["An account with this email already exists"] } },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const userId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(users).values({
      id: userId,
      organizationId: invite.organizationId,
      email: normalizedEmail,
      name,
      passwordHash,
      role: "MEMBER",
      createdAt: now,
      updatedAt: now,
    });

    await tx
      .update(memberInvites)
      .set({ acceptedAt: now })
      .where(eq(memberInvites.id, invite.id));
  });

  await createSession(userId);

  return NextResponse.json(
    {
      user: {
        id: userId,
        name,
        email: normalizedEmail,
        role: "MEMBER" as const,
      },
    },
    { status: 201 },
  );
  },
);
