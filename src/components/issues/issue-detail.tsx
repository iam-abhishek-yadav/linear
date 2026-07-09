"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Link2,
  Loader2,
  MoreHorizontal,
  Star,
  Trash2,
} from "lucide-react";
import { IssuePropertiesPanel } from "@/components/issues/issue-properties-panel";
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
import { useSession } from "@/components/session-provider";
import { SidebarTrigger } from "@/components/sidebar-provider";
import { useMembers } from "@/hooks/use-members";
import { useTasks } from "@/hooks/use-tasks";
import { TaskActivityFeed } from "@/components/issues/task-activity-feed";
import { TaskComments } from "@/components/issues/task-comments";
import {
  formatTaskIdentifier,
  getProjectKey,
  toDateInputValue,
} from "@/lib/task-utils";
import type { Task } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
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
  const initializedRef = useRef(false);

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
  const [copied, setCopied] = useState(false);

  const isAdmin = user.role === "ADMIN";
  const identifier = task ? formatTaskIdentifier(task, tasks, projectKey) : null;

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [tasks],
  );

  const currentIndex = task
    ? sortedTasks.findIndex((item) => item.id === task.id)
    : -1;
  const prevTask = currentIndex > 0 ? sortedTasks[currentIndex - 1] : null;
  const nextTask =
    currentIndex >= 0 && currentIndex < sortedTasks.length - 1
      ? sortedTasks[currentIndex + 1]
      : null;

  useEffect(() => {
    if (!task) {
      initializedRef.current = false;
      return;
    }
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId ?? null);
    setDueDate(toDateInputValue(task.dueDate));
    initializedRef.current = true;
  }, [task]);

  const save = useCallback(
    async (fields: {
      title?: string;
      description?: string;
      status?: Task["status"];
      priority?: Task["priority"];
      assigneeId?: string | null;
      dueDate?: string | null;
    }) => {
      if (!task || saving) return;

      setSaving(true);
      try {
        await updateTask(task.id, {
          title: fields.title ?? title.trim(),
          description:
            fields.description ?? (description.trim() || undefined),
          status: fields.status ?? status,
          priority: fields.priority ?? priority,
          assigneeId:
            fields.assigneeId !== undefined ? fields.assigneeId : assigneeId,
          dueDate: fields.dueDate !== undefined ? fields.dueDate : dueDate,
        });
        setActivityRefreshKey((key) => key + 1);
      } finally {
        setSaving(false);
      }
    },
    [
      assigneeId,
      description,
      dueDate,
      priority,
      saving,
      status,
      task,
      title,
      updateTask,
    ],
  );

  useEffect(() => {
    if (!task || !initializedRef.current || !title.trim()) return;
    if (title === task.title && description === (task.description ?? "")) {
      return;
    }

    const timer = setTimeout(() => {
      void save({
        title: title.trim(),
        description: description.trim() || undefined,
      });
    }, 800);

    return () => clearTimeout(timer);
  }, [description, save, task, title]);

  async function handlePropertyChange(
    field: "status" | "priority" | "assigneeId" | "dueDate",
    value: Task["status"] | Task["priority"] | string | null,
  ) {
    if (!task) return;

    if (field === "status") setStatus(value as Task["status"]);
    if (field === "priority") setPriority(value as Task["priority"]);
    if (field === "assigneeId") setAssigneeId(value as string | null);
    if (field === "dueDate") setDueDate(value as string | null);

    await save({ [field]: value });
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

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
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
        <div className="flex h-11 items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-1.5">
            <SidebarTrigger />
            <nav className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <Link
                href="/list"
                className="truncate rounded px-1 py-0.5 transition-colors hover:text-foreground"
              >
                {organization.name}
              </Link>
              <ChevronRight className="size-3 shrink-0" />
              <Link
                href="/list"
                className="shrink-0 rounded px-1 py-0.5 transition-colors hover:text-foreground"
              >
                Issues
              </Link>
              <ChevronRight className="size-3 shrink-0" />
              <span className="truncate font-medium text-foreground/90">
                {identifier} {title.trim() || "Untitled"}
              </span>
            </nav>
            <button
              type="button"
              aria-label="Favorite issue"
              className="ml-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/50"
              disabled
            >
              <Star className="size-3.5" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    aria-label="More actions"
                    className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuItem
                  onClick={handleDeleteClick}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Delete issue
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {saving && (
              <span className="mr-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin" />
                Saving
              </span>
            )}
            <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <span className="px-1.5">
                {currentIndex + 1}/{sortedTasks.length}
              </span>
              <Link
                href={prevTask ? `/issues/${prevTask.id}` : "#"}
                aria-disabled={!prevTask}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md hover:bg-white/[0.04] hover:text-foreground",
                  !prevTask && "pointer-events-none opacity-30",
                )}
              >
                <ChevronUp className="size-3.5" />
              </Link>
              <Link
                href={nextTask ? `/issues/${nextTask.id}` : "#"}
                aria-disabled={!nextTask}
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md hover:bg-white/[0.04] hover:text-foreground",
                  !nextTask && "pointer-events-none opacity-30",
                )}
              >
                <ChevronDown className="size-3.5" />
              </Link>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
              aria-label="Copy link"
            >
              <Link2 className="size-3.5" />
            </button>
            {copied && (
              <span className="text-[11px] text-muted-foreground">Copied</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-8 py-6">
            <input
              ref={titleRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
              className="w-full bg-transparent text-[28px] font-semibold leading-tight outline-none placeholder:text-muted-foreground/50"
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description…"
              rows={6}
              className="mt-4 w-full resize-none bg-transparent text-[15px] leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground/50"
            />

            <section className="mt-10 border-t border-white/[0.06] pt-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-medium text-foreground">Activity</h2>
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                    getAvatarColor(user.name),
                  )}
                >
                  {getInitials(user.name)}
                </span>
              </div>
              <TaskActivityFeed
                taskId={task.id}
                refreshKey={activityRefreshKey}
              />
              <TaskComments taskId={task.id} embedded />
            </section>
          </div>
        </div>

        <IssuePropertiesPanel
          status={status}
          priority={priority}
          assigneeId={assigneeId}
          dueDate={dueDate}
          members={members}
          onStatusChange={(value) => handlePropertyChange("status", value)}
          onPriorityChange={(value) => handlePropertyChange("priority", value)}
          onAssigneeChange={(value) => handlePropertyChange("assigneeId", value)}
          onDueDateChange={(value) => handlePropertyChange("dueDate", value)}
        />
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
