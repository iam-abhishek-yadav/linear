import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { organizations, orgInvites, users } from "@/db/schema";
import { createSession, hashPassword, slugifyOrgName } from "@/lib/auth";
import { db } from "@/lib/db";
import type { OrgInvite } from "@/db/schema";

export type WorkspaceRegistrationInput = {
  orgName: string;
  name: string;
  email: string;
  password: string;
};

async function resolveUniqueSlug(orgName: string) {
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
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function createOrganizationWithAdmin(
  input: WorkspaceRegistrationInput,
  invite: OrgInvite,
) {
  const normalizedEmail = input.email.toLowerCase();

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser) {
    return { error: "email_taken" as const };
  }

  const slug = await resolveUniqueSlug(input.orgName);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const orgId = createId();
  const userId = createId();

  await db.transaction(async (tx) => {
    await tx.insert(organizations).values({
      id: orgId,
      name: input.orgName,
      slug,
      createdAt: now,
      updatedAt: now,
    });

    await tx.insert(users).values({
      id: userId,
      organizationId: orgId,
      email: normalizedEmail,
      name: input.name,
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

  return {
    user: {
      id: userId,
      name: input.name,
      email: normalizedEmail,
      role: "ADMIN" as const,
    },
    organization: { id: orgId, name: input.orgName, slug },
  };
}
