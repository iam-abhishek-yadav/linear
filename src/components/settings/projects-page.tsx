"use client";

import { useMemo, useState } from "react";
import { MoreHorizontal, Plus, Search } from "lucide-react";
import { ProjectFormDialog } from "@/components/settings/project-form-dialog";
import { ProjectsEmptyState } from "@/components/settings/projects-empty-state";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { useSession } from "@/components/session-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { ProjectSummary } from "@/lib/projects";
import { canManageMembers } from "@/lib/roles";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";
import { useProjectsStore } from "@/stores/projects-store";

function MemberAvatars({
  members,
}: {
  members: ProjectSummary["members"];
}) {
  if (members.length === 0) {
    return (
      <span className="text-[13px] text-muted-foreground">No members</span>
    );
  }

  const visible = members.slice(0, 3);
  const hidden = members.length - visible.length;

  return (
    <div className="flex items-center gap-2">
      <div className="flex -space-x-1.5">
        {visible.map((member) => (
          <span
            key={member.id}
            title={member.name}
            className={cn(
              "flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white ring-2 ring-[#0c0c0d]",
              getAvatarColor(member.name),
            )}
          >
            {getInitials(member.name)}
          </span>
        ))}
      </div>
      {hidden > 0 && (
        <span className="text-[12px] text-muted-foreground">
          +{hidden} more
        </span>
      )}
    </div>
  );
}

export function ProjectsPage({
  initialProjects,
}: {
  initialProjects: ProjectSummary[];
}) {
  const { user } = useSession();
  const userCanManage = canManageMembers(user.role);
  const projects = useProjectsStore((state) => state.projects);
  const loading = useProjectsStore((state) => state.loading);
  const hydrate = useProjectsStore((state) => state.hydrate);
  const refresh = useProjectsStore((state) => state.refresh);
  const removeProject = useProjectsStore((state) => state.removeProject);

  hydrate(initialProjects);

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(
      (project) =>
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.members.some(
          (member) =>
            member.name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query),
        ),
    );
  }, [projects, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const response = await fetch(`/api/projects/${deleteTarget.id}`, {
      method: "DELETE",
    });

    setDeleting(false);
    if (!response.ok) {
      return;
    }

    removeProject(deleteTarget.id);
    setDeleteTarget(null);
  }

  const isEmpty = projects.length === 0;
  const hasSearch = search.trim().length > 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-4 border-b border-border/40 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-6">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
            Projects
          </h1>
        </div>
        {!isEmpty && (
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:min-w-48 sm:flex-none">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search projects"
                className="h-8 w-full border-border/60 bg-black/20 pl-8 text-[14px] sm:w-56"
              />
            </div>
            {userCanManage && (
              <Button
                size="sm"
                className="h-8 bg-violet-600 text-[14px] text-white hover:bg-violet-500"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="size-3.5" />
                New project
              </Button>
            )}
          </div>
        )}
        {isEmpty && userCanManage && (
          <Button
            size="icon-sm"
            variant="ghost"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setCreateOpen(true)}
            aria-label="Create new project"
          >
            <Plus className="size-4" />
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {loading && !projects.length ? (
          <p className="px-4 py-4 text-sm text-muted-foreground md:px-8">
            Loading projects...
          </p>
        ) : isEmpty && !hasSearch ? (
          <ProjectsEmptyState
            canCreate={userCanManage}
            onCreate={userCanManage ? () => setCreateOpen(true) : undefined}
          />
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <p className="text-sm font-medium">No matching projects</p>
            <p className="text-sm text-muted-foreground">
              Try a different search.
            </p>
          </div>
        ) : (
          <div className="space-y-2 px-4 py-4 md:px-8">
            <h2 className="mb-3 text-[14px] font-medium text-muted-foreground">
              {filteredProjects.length}{" "}
              {filteredProjects.length === 1 ? "project" : "projects"}
            </h2>
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-3 md:px-4"
              >
                <p className="min-w-0 flex-1 truncate font-medium">
                  {project.name}
                </p>
                <MemberAvatars members={project.members} />
                {userCanManage && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-white/6 hover:text-foreground"
                      aria-label={`Actions for ${project.name}`}
                    >
                      <MoreHorizontal className="size-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => setEditTarget(project)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeleteTarget(project)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {userCanManage && (
        <>
          <ProjectFormDialog
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSaved={() => void refresh()}
          />
          <ProjectFormDialog
            open={Boolean(editTarget)}
            onOpenChange={(open) => {
              if (!open) setEditTarget(null);
            }}
            onSaved={() => void refresh()}
            project={editTarget}
          />

          <Dialog
            open={Boolean(deleteTarget)}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
          >
            <DialogContent className="border-border/60 bg-[#1a1a1c] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete project</DialogTitle>
                <DialogDescription>
                  Delete{" "}
                  <span className="font-medium text-foreground">
                    {deleteTarget?.name}
                  </span>
                  ? This cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteTarget(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={deleting}
                  onClick={handleDelete}
                >
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
