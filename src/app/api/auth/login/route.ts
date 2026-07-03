import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { organizations, users } from "@/db/schema";
import { createSession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

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
}
