import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { users } from "@/db/schema";
import { hashPassword, requireUserOrResponse, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { withApiRoute } from "@/lib/logger";
import {
  getPasswordChangeRetryAt,
  PASSWORD_CHANGE_COOLDOWN_MS,
} from "@/lib/password-reset";
import { changePasswordSchema } from "@/lib/profile-validations";
import { zodErrorResponse } from "@/lib/validations";

export const POST = withApiRoute(
  "profile.changePassword",
  async (request: Request) => {
    const guard = await requireUserOrResponse();
    if (guard.response) return guard.response;
    const { session } = guard;

    const body = await request.json();
    const parsed = changePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const passwordChangeRetryAt = getPasswordChangeRetryAt(
      session.user.passwordChangedAt,
    );

    if (passwordChangeRetryAt) {
      return NextResponse.json(
        {
          error: {
            form: [
              `You can change your password again after ${passwordChangeRetryAt.toLocaleString()}.`,
            ],
          },
          retryAt: passwordChangeRetryAt.toISOString(),
        },
        { status: 429 },
      );
    }

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const valid = await verifyPassword(
      parsed.data.currentPassword,
      user.passwordHash,
    );

    if (!valid) {
      return NextResponse.json(
        { error: { currentPassword: ["Current password is incorrect"] } },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(parsed.data.newPassword);
    const now = new Date();

    await db
      .update(users)
      .set({ passwordHash, passwordChangedAt: now })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({
      success: true,
      passwordChangeRetryAt: new Date(
        now.getTime() + PASSWORD_CHANGE_COOLDOWN_MS,
      ).toISOString(),
    });
  },
);
