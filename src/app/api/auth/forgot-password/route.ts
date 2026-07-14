import { NextResponse } from "next/server";
import { withApiRoute } from "@/lib/logger";
import { requestPasswordResetOtp } from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/profile-validations";
import { zodErrorResponse } from "@/lib/validations";
import { checkRateLimit } from "@/lib/rate-limit";

const GENERIC_RESPONSE = {
  success: true,
  message: "If an account with that email exists, a reset code has been sent.",
};

export const POST = withApiRoute(
  "auth.forgotPassword",
  async (request: Request) => {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return zodErrorResponse(parsed.error);
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    const rateLimit = checkRateLimit(`forgot-password:${normalizedEmail}`, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(GENERIC_RESPONSE);
    }
    await requestPasswordResetOtp(normalizedEmail);

    return NextResponse.json(GENERIC_RESPONSE);
  },
);
