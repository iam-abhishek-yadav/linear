"use client";

import { useEffect, useRef, useState } from "react";
import { IssueDetailLink } from "@/components/issues/issue-detail-link";
import { ChevronRight, Loader2, Maximize2, Trash2 } from "lucide-react";
import {
  AssigneePill,
  DueDatePill,
  PriorityPill,
  ProjectPill,
  StatusPill,
} from "@/components/tasks/property-pills";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/components/session-provider";
import { Switch } from "@/components/ui/switch";
import { useMembersCache } from "@/hooks/use-members-cache";
import { useProjects } from "@/hooks/use-projects";
import { getProjectKey, toDateInputValue } from "@/lib/task-utils";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskFormData = {
  title: string;
  description?: string;
  status: Task["status"];
  priority: Task["priority"];
  assigneeId: string | null;
  projectId: string | null;
  dueDate: string | null;
};

type TaskDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task | null;
  defaultStatus?: Task["status"];
  onSave: (data: TaskFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
};

export function TaskDialog({
  open,
  onOpenChange,
  task,
  defaultStatus = "BACKLOG",
  onSave,
  onDelete,
}: TaskDialogProps) {
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>(defaultStatus);
  const [priority, setPriority] = useState<Task["priority"]>("NONE");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [createMore, setCreateMore] = useState(false);
  const members = useMembersCache();
  const { projects } = useProjects();
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<
    "confirm" | "admin-required" | null
  >(null);
  const { user, organization } = useSession();
  const projectKey = getProjectKey(organization.name);

  const isEditing = Boolean(task);
  const isAdmin = user.role === "ADMIN";

  useEffect(() => {
    if (!open) {
      setDeleteDialog(null);
      return;
    }
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStatus(task?.status ?? defaultStatus);
    setPriority(task?.priority ?? "NONE");
    setAssigneeId(task?.assigneeId ?? null);
    setProjectId(task?.projectId ?? null);
    setDueDate(toDateInputValue(task?.dueDate));
    setCreateMore(false);
    requestAnimationFrame(() => titleRef.current?.focus());
  }, [open, task, defaultStatus]);

  async function submit() {
    if (!title.trim() || saving) return;

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assigneeId,
        projectId,
        dueDate,
      });

      if (isEditing || !createMore) {
        onOpenChange(false);
      } else {
        setTitle("");
        setDescription("");
        setAssigneeId(null);
        setProjectId(null);
        setDueDate(null);
        titleRef.current?.focus();
      }
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteClick() {
    if (!onDelete) return;
    setDeleteDialog(isAdmin ? "confirm" : "admin-required");
  }

  async function handleConfirmDelete() {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete();
      setDeleteDialog(null);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      submit();
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-[720px]"
        showCloseButton
      >
        <DialogTitle className="sr-only">
          {isEditing ? "Edit issue" : "New issue"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEditing ? "Update issue details" : "Create a new issue"}
        </DialogDescription>

        <div className="flex items-center border-b border-border/50 py-3 pl-4 pr-12">
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded bg-muted/40 px-1.5 py-0.5 font-medium text-foreground/80">
              <span className="size-2.5 rounded-sm bg-emerald-500/90" />
              {projectKey}
            </span>
            <ChevronRight className="size-3" />
            <span>{isEditing ? "Edit issue" : "New issue"}</span>
          </div>
          {isEditing && task && (
            <IssueDetailLink
              taskId={task.id}
              onClick={() => onOpenChange(false)}
              className="mr-1 flex shrink-0 items-center gap-1 rounded px-1.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <Maximize2 className="size-3" />
              Open
            </IssueDetailLink>
          )}
        </div>

        <div className="px-5 pt-5 pb-3" onKeyDown={handleKeyDown}>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            className="w-full bg-transparent text-lg font-medium outline-none placeholder:text-muted-foreground/70"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description…"
            rows={4}
            className="mt-3 min-h-[96px] w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-5 pb-5">
          <StatusPill value={status} onChange={setStatus} />
          <PriorityPill value={priority} onChange={setPriority} />
          <AssigneePill
            value={assigneeId}
            members={members}
            onChange={setAssigneeId}
          />
          <ProjectPill
            value={projectId}
            projects={projects}
            onChange={setProjectId}
          />
          <DueDatePill value={dueDate} onChange={setDueDate} />
        </div>

        <div className="flex items-center gap-3 border-t border-border/50 px-5 py-3">
          {isEditing && onDelete ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={handleDeleteClick}
              disabled={deleting || saving}
            >
              {deleting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Trash2 className="size-3.5" />
              )}
              Delete issue
            </Button>
          ) : !isEditing ? (
            <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <Switch
                checked={createMore}
                onCheckedChange={setCreateMore}
                className="data-checked:bg-violet-600"
              />
              Create more
            </label>
          ) : null}
          <Button
            type="button"
            size="sm"
            disabled={!title.trim() || saving || deleting}
            onClick={submit}
            className={cn(
              "ml-auto rounded-md bg-violet-600 px-3 text-white hover:bg-violet-600/90",
            )}
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {isEditing ? "Save issue" : "Create issue"}
          </Button>
        </div>
      </DialogContent>

      <Dialog
        open={deleteDialog === "confirm"}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Delete issue</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <span className="text-foreground">
                {title.trim() || "this issue"}
              </span>
              . This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={handleConfirmDelete}
            >
              {deleting ? "Deleting..." : "Delete issue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteDialog === "admin-required"}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(null);
        }}
      >
        <DialogContent className="sm:max-w-md" showCloseButton>
          <DialogHeader>
            <DialogTitle>Admin required</DialogTitle>
            <DialogDescription>
              Only workspace admins can delete issues. Ask an admin to delete
              this issue for you.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDeleteDialog(null)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
