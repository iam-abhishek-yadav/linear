import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { withApiRoute } from "@/lib/logger";
import { resetPasswordWithOtp } from "@/lib/password-reset";
import { resetPasswordSchema } from "@/lib/profile-validations";
import { zodErrorResponse } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = withApiRoute(
  "auth.resetPassword",
  async (request: Request) => {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    const rateLimit = checkRateLimit(`reset-password:${normalizedEmail}`, {
      maxAttempts: 10,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: {
            form: ["Too many attempts. Try again later."],
          },
        },
        { status: 429 },
      );
    }

    const result = await resetPasswordWithOtp({
      email: normalizedEmail,
      otp: parsed.data.otp,
      newPassword: parsed.data.newPassword,
      hashPassword,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: {
            form: ["Invalid or expired reset code. Request a new one."],
          },
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true });
  },
);
