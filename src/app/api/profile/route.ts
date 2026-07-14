import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { requireUserOrResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { withApiRoute } from "@/lib/logger";
import { getPasswordChangeRetryAt } from "@/lib/password-reset";
import { updateProfileSchema } from "@/lib/profile-validations";
import { zodErrorResponse } from "@/lib/validations";

export const GET = withApiRoute("profile.get", async () => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const passwordChangeRetryAt = getPasswordChangeRetryAt(
    session.user.passwordChangedAt,
  );

  return NextResponse.json({
    profile: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      passwordChangeRetryAt: passwordChangeRetryAt?.toISOString() ?? null,
    },
  });
});

export const PATCH = withApiRoute("profile.update", async (request: Request) => {
  const guard = await requireUserOrResponse();
  if (guard.response) return guard.response;
  const { session } = guard;

  const body = await request.json();
  const parsed = updateProfileSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  if (parsed.data.name === undefined) {
    return NextResponse.json(
      { error: { form: ["No changes to save"] } },
      { status: 400 },
    );
  }

  const [updated] = await db
    .update(users)
    .set({ name: parsed.data.name.trim() })
    .where(eq(users.id, session.user.id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      passwordChangedAt: users.passwordChangedAt,
    });

  const passwordChangeRetryAt = getPasswordChangeRetryAt(
    updated.passwordChangedAt,
  );

  return NextResponse.json({
    profile: {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      passwordChangeRetryAt: passwordChangeRetryAt?.toISOString() ?? null,
    },
  });
});
