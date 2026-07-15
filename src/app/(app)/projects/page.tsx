import { redirect } from "next/navigation";
import { ProjectsPage } from "@/components/settings/projects-page";
import { requireUser } from "@/lib/auth";
import { listOrgProjects } from "@/lib/projects";

export default async function ProjectsPageRoute() {
  const session = await requireUser();

  if (!session) {
    redirect("/login");
  }

  const projects = await listOrgProjects(
    session.organization.id,
    session.user.id,
  );

  return <ProjectsPage initialProjects={projects} />;
}
