"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { PriorityPill, StatusPill } from "@/components/tasks/property-pills";
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
import { PROJECT_KEY } from "@/lib/task-utils";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskFormData = {
  title: string;
  description?: string;
  status: Task["status"];
  priority: Task["priority"];
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
  const [createMore, setCreateMore] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<
    "confirm" | "admin-required" | null
  >(null);
  const { user } = useSession();

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
      });

      if (isEditing || !createMore) {
        onOpenChange(false);
      } else {
        setTitle("");
        setDescription("");
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
        className="gap-0 overflow-hidden p-0 sm:max-w-[560px]"
        showCloseButton
      >
        <DialogTitle className="sr-only">
          {isEditing ? "Edit issue" : "New issue"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isEditing ? "Update issue details" : "Create a new issue"}
        </DialogDescription>

        <div className="flex items-center border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded bg-muted/40 px-1.5 py-0.5 font-medium text-foreground/80">
              <span className="size-2.5 rounded-sm bg-emerald-500/90" />
              {PROJECT_KEY}
            </span>
            <ChevronRight className="size-3" />
            <span>{isEditing ? "Edit issue" : "New issue"}</span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-3" onKeyDown={handleKeyDown}>
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            className="w-full bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground/70"
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description…"
            rows={2}
            className="mt-3 w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-4 pb-4">
          <StatusPill value={status} onChange={setStatus} />
          <PriorityPill value={priority} onChange={setPriority} />
        </div>

        <div className="flex items-center gap-3 border-t border-border/50 px-4 py-3">
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
          <DialogFooter className="border-0 bg-transparent p-0">
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
          <DialogFooter className="border-0 bg-transparent p-0">
            <Button onClick={() => setDeleteDialog(null)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

export function NewTaskButton({
  status,
  onCreate,
}: {
  status: Task["status"];
  onCreate: (data: TaskFormData) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
      >
        <Plus className="size-3.5" />
        Add issue
      </button>
      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        defaultStatus={status}
        onSave={onCreate}
      />
    </>
  );
}
