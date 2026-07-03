import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { organizations, orgInvites, users } from "@/db/schema";
import {
  createSession,
  hashPassword,
  slugifyOrgName,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { getValidOrgInvite } from "@/lib/invites";
import { registerSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const { token, orgName, name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const invite = await getValidOrgInvite(token);

  if (!invite) {
    return NextResponse.json(
      { error: { token: ["This invite is invalid or has expired"] } },
      { status: 400 },
    );
  }

  if (invite.email && invite.email !== normalizedEmail) {
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

  const baseSlug = slugifyOrgName(orgName);
  let slug = baseSlug || createId();
  let suffix = 0;

  while (true) {
    const [existingOrg] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    if (!existingOrg) {
      break;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const passwordHash = await hashPassword(password);
  const now = new Date();
  const orgId = createId();
  const userId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({
      id: orgId,
      name: orgName,
      slug,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(users).values({
      id: userId,
      organizationId: orgId,
      email: normalizedEmail,
      name,
      passwordHash,
      role: "ADMIN",
      createdAt: now,
      updatedAt: now,
    });

    await tx
      .update(orgInvites)
      .set({ acceptedAt: now })
      .where(eq(orgInvites.id, invite.id));
  });

  await createSession(userId);

  return NextResponse.json(
    {
      user: { id: userId, name, email: normalizedEmail, role: "ADMIN" as const },
      organization: { id: orgId, name: orgName, slug },
    },
    { status: 201 },
  );
}
