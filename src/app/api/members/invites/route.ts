import { and, eq, gt, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { memberInvites, users } from "@/db/schema";
import { requireMemberManagerOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { createMemberInvite } from "@/lib/member-invites";
import { createMemberInviteSchema } from "@/lib/member-validations";
import { zodErrorResponse } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = withApiRoute("members.invites.create", async (request: Request) => {
  const guard = await requireMemberManagerOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const body = await request.json();
  const parsed = createMemberInviteSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const normalizedEmail = parsed.data.email.toLowerCase();

  const rateLimit = checkRateLimit(`member-invite-create:${session.organization.id}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { form: ["Too many invites sent. Try again later."] } },
      { status: 429 },
    );
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    return NextResponse.json(
      { error: { email: ["A user with this email already exists"] } },
      { status: 409 },
    );
  }

  const [existingInvite] = await db
    .select({ id: memberInvites.id })
    .from(memberInvites)
    .where(
      and(
        eq(memberInvites.organizationId, session.organization.id),
        eq(memberInvites.email, normalizedEmail),
        isNull(memberInvites.acceptedAt),
        gt(memberInvites.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (existingInvite) {
    return NextResponse.json(
      {
        error: {
          email: ["This person already has a pending invite"],
        },
      },
      { status: 409 },
    );
  }

  const invite = await createMemberInvite({
    organizationId: session.organization.id,
    email: normalizedEmail,
    invitedByUserId: session.user.id,
  });

  return NextResponse.json(
    {
      invite: {
        id: invite.id,
        email: invite.email,
        expiresAt: invite.expiresAt.toISOString(),
        inviteUrl: invite.inviteUrl,
      },
    },
    { status: 201 },
  );
});
