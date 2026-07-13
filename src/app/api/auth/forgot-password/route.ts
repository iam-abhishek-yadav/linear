import { NextResponse } from "next/server";
import { isDbConnectionError } from "@/lib/db";
import { withApiRoute } from "@/lib/logger";
import { requestPasswordResetOtp } from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/profile-validations";
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
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const normalizedEmail = parsed.data.email.toLowerCase();

    const rateLimit = checkRateLimit(`forgot-password:${normalizedEmail}`, {
      maxAttempts: 5,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.allowed) {
      return NextResponse.json(GENERIC_RESPONSE);
    }

    try {
      // Whether the account exists, was just emailed, or is on its own
      // hourly cooldown, the response is identical — distinguishing any of
      // these cases would let a caller enumerate registered emails.
      await requestPasswordResetOtp(normalizedEmail);

      return NextResponse.json(GENERIC_RESPONSE);
    } catch (error) {
      if (isDbConnectionError(error)) {
        return NextResponse.json(
          {
            error: {
              form: [
                "Unable to reach the database right now. Check that Postgres is running and DATABASE_URL is correct, then try again.",
              ],
            },
          },
          { status: 503 },
        );
      }

      throw error;
    }
  },
);
