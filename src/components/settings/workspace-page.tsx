"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { WorkspaceProjectsSection } from "@/components/settings/workspace-projects-section";
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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import type { ProjectSummary } from "@/lib/projects";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type WorkspaceOrg = {
  id: string;
  name: string;
  slug: string;
};

export function WorkspacePage({
  initialOrganization,
  initialProjects,
}: {
  initialOrganization: WorkspaceOrg;
  initialProjects: ProjectSummary[];
}) {
  const router = useRouter();
  const [organization, setOrganization] = useState(initialOrganization);
  const [name, setName] = useState(initialOrganization.name);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const initials = getInitials(name || organization.name);
  const avatarColor = getAvatarColor(name || organization.name);
  const nameChanged = name.trim() !== organization.name;
  const canDelete = deleteConfirm === organization.name;

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setSaved(false);

    const response = await fetch("/api/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setErrors(data.error ?? { form: ["Something went wrong"] });
      return;
    }

    setName(data.organization.name);
    setOrganization({
      id: data.organization.id,
      name: data.organization.name,
      slug: data.organization.slug,
    });
    setSaved(true);
    router.refresh();
  }

  async function handleDelete() {
    if (!canDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    const response = await fetch("/api/organization", { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setDeleting(false);

    if (!response.ok) {
      setDeleteError(data.error ?? "Failed to delete workspace");
      return;
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-b border-border/40 px-4 py-4 md:px-8 md:py-6">
        <SidebarTrigger />
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          Workspace
        </h1>
      </div>

      <div className="min-h-0 flex-1 space-y-10 overflow-auto px-4 py-6 md:px-8">
        <div className="flex items-center gap-4">
          <span
            className={cn(
              "flex size-12 items-center justify-center rounded-lg text-sm font-bold text-white",
              avatarColor,
            )}
          >
            {initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-medium">
              {name || organization.name}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {organization.slug}
            </p>
          </div>
        </div>

        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium">General</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update the workspace display name. The URL slug updates
              automatically.
            </p>
          </div>

          <form onSubmit={handleSave}>
            <FieldGroup>
              <div className="flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
                <Field
                  data-invalid={!!errors.name}
                  className="min-w-0 flex-1"
                >
                  <FieldLabel htmlFor="org-name" className="text-xs">
                    Name
                  </FieldLabel>
                  <Input
                    id="org-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setSaved(false);
                    }}
                    maxLength={100}
                    required
                    className="h-7 text-[13px]"
                  />
                  <FieldError>{errors.name?.[0]}</FieldError>
                </Field>

                <Field className="min-w-0 flex-1">
                  <FieldLabel htmlFor="org-slug" className="text-xs">
                    Slug
                  </FieldLabel>
                  <Input
                    id="org-slug"
                    value={organization.slug}
                    disabled
                    className="h-7 text-[13px]"
                  />
                </Field>

                <div className="flex shrink-0 items-center gap-2 pb-0.5">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-[13px]"
                    disabled={saving || !nameChanged || !name.trim()}
                  >
                    {saving ? "Saving..." : "Save changes"}
                  </Button>
                  {saved && (
                    <span className="text-xs text-emerald-400">Saved</span>
                  )}
                </div>
              </div>

              {errors.form?.[0] && (
                <p className="text-sm text-destructive">{errors.form[0]}</p>
              )}
            </FieldGroup>
          </form>
        </section>

        <WorkspaceProjectsSection initialProjects={initialProjects} />

        <section className="space-y-4 border-t border-border/40 pt-8">
          <div>
            <h2 className="text-sm font-medium text-destructive">
              Danger zone
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently delete this workspace and all of its data. This cannot
              be undone.
            </p>
          </div>
          <Button
            variant="destructive"
            onClick={() => {
              setDeleteConfirm("");
              setDeleteError(null);
              setDeleteOpen(true);
            }}
          >
            Delete workspace
          </Button>
        </section>
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteOpen(false);
            setDeleteConfirm("");
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="border-border/60 bg-[#1a1a1c] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete workspace</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="text-foreground">{organization.name}</span>{" "}
              and all members, issues, and invites. Type the workspace name to
              confirm.
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="delete-confirm">Workspace name</FieldLabel>
            <Input
              id="delete-confirm"
              value={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.value)}
              placeholder={organization.name}
              autoComplete="off"
            />
          </Field>
          {deleteError && (
            <p className="text-sm text-destructive">{deleteError}</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={!canDelete || deleting}
              onClick={handleDelete}
            >
              {deleting ? "Deleting..." : "Delete workspace"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
