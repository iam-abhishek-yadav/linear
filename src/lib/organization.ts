import { createId } from "@paralleldrive/cuid2";
import { and, eq, ne } from "drizzle-orm";
import { organizations } from "@/db/schema";
import { slugifyOrgName } from "@/lib/auth";
import { db } from "@/lib/db";

export async function resolveUniqueSlug(
  orgName: string,
  excludeOrganizationId?: string,
) {
  const baseSlug = slugifyOrgName(orgName);
  let slug = baseSlug || createId();
  let suffix = 0;

  while (true) {
    const [existingOrg] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(
        excludeOrganizationId
          ? and(
              eq(organizations.slug, slug),
              ne(organizations.id, excludeOrganizationId),
            )
          : eq(organizations.slug, slug),
      )
      .limit(1);

    if (!existingOrg) {
      return slug;
    }

    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

export async function updateOrganizationName(
  organizationId: string,
  name: string,
) {
  const slug = await resolveUniqueSlug(name, organizationId);
  const now = new Date();

  const [updated] = await db
    .update(organizations)
    .set({ name, slug, updatedAt: now })
    .where(eq(organizations.id, organizationId))
    .returning();

  return updated;
}

export async function deleteOrganization(organizationId: string) {
  await db.delete(organizations).where(eq(organizations.id, organizationId));
}
