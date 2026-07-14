import { redirect } from "next/navigation";
import { WorkspacePage } from "@/components/settings/workspace-page";
import { requireAdmin } from "@/lib/auth";

export default async function WorkspaceSettingsPage() {
  const session = await requireAdmin();

  if (!session) {
    redirect("/settings/profile");
  }

  return (
    <WorkspacePage
      initialOrganization={{
        id: session.organization.id,
        name: session.organization.name,
        slug: session.organization.slug,
      }}
    />
  );
}
