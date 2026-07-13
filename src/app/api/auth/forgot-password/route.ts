import { NextResponse } from "next/server";
import { isDbConnectionError } from "@/lib/db";
import { withApiRoute } from "@/lib/logger";
import { requestPasswordResetOtp } from "@/lib/password-reset";
import { forgotPasswordSchema } from "@/lib/profile-validations";

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

    try {
      const result = await requestPasswordResetOtp(normalizedEmail);

      if ("rateLimited" in result && result.rateLimited) {
        return NextResponse.json(
          {
            error: {
              email: [
                `A reset email was already sent. Try again after ${result.retryAt.toLocaleString()}.`,
              ],
            },
            retryAt: result.retryAt.toISOString(),
          },
          { status: 429 },
        );
      }

      return NextResponse.json({
        success: true,
        message:
          "If an account with that email exists, a reset code has been sent.",
      });
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
