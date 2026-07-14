import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { organizations, users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema, zodErrorResponse } from "@/lib/validations";
import { withApiRoute } from "@/lib/logger";
import { checkRateLimit } from "@/lib/rate-limit";

export const POST = withApiRoute("auth.login", async (request: Request) => {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return zodErrorResponse(parsed.error);
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const rateLimit = checkRateLimit(`login:${normalizedEmail}`);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: { email: ["Too many attempts. Try again later."] } },
      { status: 429 },
    );
  }

  const [result] = await db
    .select({
      user: users,
      organization: organizations,
    })
    .from(users)
    .innerJoin(organizations, eq(users.organizationId, organizations.id))
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (!result) {
    return NextResponse.json(
      { error: { email: ["Invalid email or password"] } },
      { status: 401 },
    );
  }

  const valid = await verifyPassword(password, result.user.passwordHash);

  if (!valid) {
    return NextResponse.json(
      { error: { email: ["Invalid email or password"] } },
      { status: 401 },
    );
  }

  await createSession(result.user.id);

  const { passwordHash: _, ...user } = result.user;

  return NextResponse.json({
    user,
    organization: result.organization,
  });
});
