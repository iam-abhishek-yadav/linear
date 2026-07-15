"use client";

import { useEffect, useRef, useState } from "react";
import { Box, Check, ChevronRight, Users } from "lucide-react";
import { useMembersCache } from "@/hooks/use-members-cache";
import { useSession } from "@/components/session-provider";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectSummary } from "@/lib/projects";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type ProjectFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  project?: ProjectSummary | null;
};

const pillClass =
  "h-7 gap-1.5 rounded-md border border-border/50 bg-muted/20 px-2 text-xs font-normal text-muted-foreground hover:bg-muted/40 hover:text-foreground";

function splitDescription(description: string | null | undefined) {
  if (!description) {
    return { summary: "", body: "" };
  }
  const parts = description.split(/\n\n/);
  if (parts.length === 1) {
    return { summary: description, body: "" };
  }
  return { summary: parts[0] ?? "", body: parts.slice(1).join("\n\n") };
}

function joinDescription(summary: string, body: string) {
  const trimmedSummary = summary.trim();
  const trimmedBody = body.trim();
  if (trimmedSummary && trimmedBody) {
    return `${trimmedSummary}\n\n${trimmedBody}`;
  }
  return trimmedSummary || trimmedBody || null;
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  onSaved,
  project = null,
}: ProjectFormDialogProps) {
  const { organization } = useSession();
  const members = useMembersCache();
  const nameRef = useRef<HTMLInputElement>(null);
  const isEditing = Boolean(project);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    const { summary: initialSummary, body } = splitDescription(
      project?.description,
    );
    setName(project?.name ?? "");
    setSummary(initialSummary);
    setDescription(body);
    setMemberIds(project?.members.map((member) => member.id) ?? []);
    setErrors({});
    setLoading(false);
    requestAnimationFrame(() => nameRef.current?.focus());
  }, [open, project]);

  function toggleMember(memberId: string) {
    setMemberIds((current) =>
      current.includes(memberId)
        ? current.filter((id) => id !== memberId)
        : [...current, memberId],
    );
  }

  async function handleSubmit() {
    if (!name.trim() || loading) {
      return;
    }

    setLoading(true);
    setErrors({});

    const descriptionValue = joinDescription(summary, description);

    if (isEditing && project) {
      const updateResponse = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: descriptionValue,
        }),
      });
      const updateData = await updateResponse.json();

      if (!updateResponse.ok) {
        setErrors(updateData.error ?? { form: ["Something went wrong"] });
        setLoading(false);
        return;
      }

      const membersResponse = await fetch(
        `/api/projects/${project.id}/members`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ memberIds }),
        },
      );
      const membersData = await membersResponse.json();

      if (!membersResponse.ok) {
        setErrors(membersData.error ?? { form: ["Failed to update members"] });
        setLoading(false);
        return;
      }

      setLoading(false);
      onSaved();
      onOpenChange(false);
      return;
    }

    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        description: descriptionValue ?? undefined,
        memberIds,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setErrors(data.error ?? { form: ["Something went wrong"] });
      setLoading(false);
      return;
    }

    setLoading(false);
    onSaved();
    onOpenChange(false);
  }

  const selectedMembers = members.filter((member) =>
    memberIds.includes(member.id),
  );
  const orgInitials = getInitials(organization.name);
  const orgColor = getAvatarColor(organization.name);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden border-border/60 bg-[#1a1a1c] p-0 sm:max-w-[640px]"
        showCloseButton
      >
        <DialogTitle className="sr-only">
          {isEditing ? "Edit project" : "New project"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEditing ? "Update project details" : "Create a new project"}
        </DialogDescription>

        <div className="flex items-center border-b border-border/50 py-3 pl-4 pr-12">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded bg-muted/40 px-1.5 py-0.5 font-medium text-foreground/80">
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-sm text-[9px] font-bold text-white",
                  orgColor,
                )}
              >
                {orgInitials}
              </span>
              {organization.name}
            </span>
            <ChevronRight className="size-3" />
            <span>{isEditing ? "Edit project" : "New project"}</span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <button
              type="button"
              className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md border border-border/50 bg-muted/20 text-muted-foreground"
              aria-hidden
              tabIndex={-1}
            >
              <Box className="size-4" />
            </button>
            <div className="min-w-0 flex-1">
              <input
                ref={nameRef}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Project name"
                className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/70"
                aria-invalid={!!errors.name}
              />
              <input
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Add a short summary…"
                className="mt-2 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button type="button" variant="outline" className={pillClass} />
              }
            >
              <Users className="size-3.5" />
              <span>
                {selectedMembers.length === 0
                  ? "Members"
                  : selectedMembers.length === 1
                    ? selectedMembers[0].name
                    : `${selectedMembers.length} members`}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Add members…
                </DropdownMenuLabel>
                {members.length === 0 ? (
                  <DropdownMenuItem disabled>
                    No workspace members
                  </DropdownMenuItem>
                ) : (
                  members.map((member) => {
                    const selected = memberIds.includes(member.id);
                    return (
                      <DropdownMenuItem
                        key={member.id}
                        onClick={() => toggleMember(member.id)}
                      >
                        <UserAvatar name={member.name} size="sm" />
                        <span className="flex-1 truncate">{member.name}</span>
                        {selected && (
                          <Check className="size-3.5 text-muted-foreground" />
                        )}
                      </DropdownMenuItem>
                    );
                  })
                )}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="border-t border-border/50 px-4 py-3">
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Write a description, a project brief, or collect ideas…"
            rows={4}
            className="w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/60"
          />
        </div>

        {(errors.name?.[0] ||
          errors.description?.[0] ||
          errors.memberIds?.[0] ||
          errors.form?.[0]) && (
          <p className="px-4 pb-2 text-sm text-destructive">
            {errors.name?.[0] ??
              errors.description?.[0] ??
              errors.memberIds?.[0] ??
              errors.form?.[0]}
          </p>
        )}

        <DialogFooter className="border-t border-border/50 px-4 py-3 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-violet-600 text-white hover:bg-violet-500"
            disabled={loading || !name.trim()}
            onClick={handleSubmit}
          >
            {loading
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save changes"
                : "Create project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
