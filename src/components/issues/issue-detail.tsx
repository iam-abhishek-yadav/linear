"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ChevronRight, Loader2, Trash2 } from "lucide-react";
import {
  AssigneePill,
  DueDatePill,
  PriorityPill,
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
import { useMembers } from "@/hooks/use-members";
import { useTasks } from "@/hooks/use-tasks";
import { TaskActivityFeed } from "@/components/issues/task-activity-feed";
import { TaskComments } from "@/components/issues/task-comments";
import {
  formatTaskDate,
  formatTaskIdentifier,
  getProjectKey,
  toDateInputValue,
} from "@/lib/task-utils";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function IssueDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, organization } = useSession();
  const { tasks, loading, updateTask, deleteTask } = useTasks();
  const members = useMembers();

  const projectKey = getProjectKey(organization.name);
  const task = tasks.find((t) => t.id === id);
  const titleRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Task["status"]>("BACKLOG");
  const [priority, setPriority] = useState<Task["priority"]>("NONE");
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<
    "confirm" | "admin-required" | null
  >(null);
  const [activityRefreshKey, setActivityRefreshKey] = useState(0);

  const isAdmin = user.role === "ADMIN";
  const identifier = task ? formatTaskIdentifier(task, tasks, projectKey) : null;

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId ?? null);
    setDueDate(toDateInputValue(task.dueDate));
  }, [task]);

  async function submit() {
    if (!task || !title.trim() || saving) return;

    setSaving(true);
    try {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        assigneeId,
        dueDate,
      });
      setActivityRefreshKey((key) => key + 1);
    } finally {
      setSaving(false);
    }
  }

  function handleDeleteClick() {
    setDeleteDialog(isAdmin ? "confirm" : "admin-required");
  }

  async function handleConfirmDelete() {
    if (!task) return;
    setDeleting(true);
    try {
      await deleteTask(task.id);
      router.push("/board");
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

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Issue not found</p>
        <Link
          href="/board"
          className="text-sm text-violet-400 hover:text-violet-300"
        >
          Back to board
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="shrink-0 border-b border-white/[0.06]">
        <div className="flex h-11 items-center px-5">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link
              href="/board"
              className="inline-flex items-center gap-1.5 rounded bg-muted/40 px-1.5 py-0.5 font-medium text-foreground/80 transition-colors hover:bg-muted/60"
            >
              <span className="size-2.5 rounded-sm bg-emerald-500/90" />
              {projectKey}
            </Link>
            <ChevronRight className="size-3" />
            <span className="font-mono text-foreground/70">{identifier}</span>
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto"
        onKeyDown={handleKeyDown}
      >
        <div className="mx-auto max-w-3xl px-6 py-8">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
            className="w-full bg-transparent text-2xl font-semibold outline-none placeholder:text-muted-foreground/70"
          />

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <StatusPill value={status} onChange={setStatus} />
            <PriorityPill value={priority} onChange={setPriority} />
            <AssigneePill
              value={assigneeId}
              members={members}
              onChange={setAssigneeId}
            />
            <DueDatePill value={dueDate} onChange={setDueDate} />
          </div>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add description…"
            rows={12}
            className="mt-8 w-full resize-none bg-transparent text-sm leading-relaxed outline-none placeholder:text-muted-foreground/70"
          />

          <div className="mt-8 flex items-center gap-4 border-t border-border/50 pt-6 text-xs text-muted-foreground">
            <span>Created {formatTaskDate(task.createdAt)}</span>
            <span>Updated {formatTaskDate(task.updatedAt)}</span>
          </div>

          <div className="mt-8 border-t border-border/50 pt-6">
            <h2 className="mb-4 text-sm font-medium text-foreground">Comments</h2>
            <TaskComments taskId={task.id} />
          </div>

          <div className="mt-8 border-t border-border/50 pt-6">
            <h2 className="mb-4 text-sm font-medium text-foreground">Activity</h2>
            <TaskActivityFeed taskId={task.id} refreshKey={activityRefreshKey} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border/50 px-6 py-3">
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
          Save issue
        </Button>
      </div>

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
    </>
  );
}
