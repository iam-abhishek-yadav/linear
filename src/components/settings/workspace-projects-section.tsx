"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { MoreHorizontal, Plus } from "lucide-react";
import { ProjectFormDialog } from "@/components/settings/project-form-dialog";
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
import { fetchProjects } from "@/lib/api";
import type { ProjectSummary } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

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

export function WorkspaceProjectsSection({
  initialProjects,
}: {
  initialProjects: ProjectSummary[];
}) {
  const queryClient = useQueryClient();
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects,
    queryFn: fetchProjects,
    initialData: initialProjects,
  });
  const projects = projectsQuery.data ?? initialProjects;

  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ProjectSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refreshProjects() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  }

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

    setDeleteTarget(null);
    await refreshProjects();
  }

  return (
    <section className="space-y-4 border-t border-border/40 pt-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-medium">Projects</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create projects and assign workspace members to them.
          </p>
        </div>
        <Button
          size="sm"
          className="h-8 shrink-0 bg-violet-600 text-[14px] text-white hover:bg-violet-500"
          onClick={() => setCreateOpen(true)}
        >
          <Plus className="size-3.5" />
          New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-muted-foreground">No projects yet.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border/40">
          <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-4 border-b border-border/40 bg-white/2 px-4 py-2 text-[12px] font-medium text-muted-foreground md:grid">
            <span>Name</span>
            <span>Members</span>
            <span className="w-7" />
          </div>
          <div className="divide-y divide-border/40">
            {projects.map((project) => (
              <div
                key={project.id}
                className="grid gap-3 px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-4"
              >
                <p className="truncate font-medium">{project.name}</p>
                <MemberAvatars members={project.members} />
                <div className="flex justify-end">
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
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ProjectFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSaved={refreshProjects}
      />
      <ProjectFormDialog
        open={Boolean(editTarget)}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSaved={refreshProjects}
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
    </section>
  );
}
