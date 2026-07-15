import { redirect } from "next/navigation";
import { WorkspacePage } from "@/components/settings/workspace-page";
import { requireAdmin } from "@/lib/auth";
import { listOrgProjects } from "@/lib/projects";

export default async function WorkspaceSettingsPage() {
  const session = await requireAdmin();

  if (!session) {
    redirect("/settings/profile");
  }

  const projects = await listOrgProjects(session.organization.id);

  return (
    <WorkspacePage
      initialOrganization={{
        id: session.organization.id,
        name: session.organization.name,
        slug: session.organization.slug,
      }}
      initialProjects={projects}
    />
  );
}
