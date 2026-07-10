"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { IssueActivitySection } from "@/components/issues/issue-activity-section";
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
import { IssueDetailLink } from "@/components/issues/issue-detail-link";
import { useMembersCache } from "@/hooks/use-members-cache";
import { useTaskTimeline } from "@/hooks/use-task-timeline";
import type { IssueDetailData, SerializedTask } from "@/lib/issue-detail-data";
import { revalidateIssueCaches } from "@/lib/revalidate-issue";
import { queryKeys } from "@/lib/query-keys";
import { buildPropertyChangeActivity } from "@/lib/task-timeline";
import {
  formatTaskIdentifier,
  getProjectKey,
  toDateInputValue,
} from "@/lib/task-utils";
import type { Task } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

export function IssueDetail({ initialData }: { initialData: IssueDetailData }) {
  return <IssueDetailView data={initialData} />;
}

function IssueDetailView({ data }: { data: IssueDetailData }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, organization } = useSession();
  const members = useMembersCache();
  const titleRef = useRef<HTMLInputElement>(null);
  const initializedRef = useRef(false);

  const [task, setTask] = useState(data.task);
  const [taskNav] = useState(data.tasks);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<Task["status"]>(task.status);
  const [priority, setPriority] = useState<Task["priority"]>(task.priority);
  const [assigneeId, setAssigneeId] = useState<string | null>(
    task.assigneeId ?? null,
  );
  const [dueDate, setDueDate] = useState<string | null>(
    toDateInputValue(task.dueDate),
  );
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<
    "confirm" | "admin-required" | null
  >(null);
  const [copied, setCopied] = useState(false);

  const timeline = useTaskTimeline(task.id, {
    activities: data.activities,
    comments: data.comments,
  });

  const projectKey = getProjectKey(organization.name);
  const isAdmin = user.role === "ADMIN";
  const identifier = formatTaskIdentifier(task, taskNav, projectKey);

  const sortedTasks = useMemo(
    () =>
      [...taskNav].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [taskNav],
  );

  const currentIndex = sortedTasks.findIndex((item) => item.id === task.id);
  const prevTask = currentIndex > 0 ? sortedTasks[currentIndex - 1] : null;
  const nextTask =
    currentIndex >= 0 && currentIndex < sortedTasks.length - 1
      ? sortedTasks[currentIndex + 1]
      : null;

  useEffect(() => {
    setTask(data.task);
    setTitle(data.task.title);
    setDescription(data.task.description ?? "");
    setStatus(data.task.status);
    setPriority(data.task.priority);
    setAssigneeId(data.task.assigneeId ?? null);
    setDueDate(toDateInputValue(data.task.dueDate));
    initializedRef.current = true;
  }, [data.task.id, data.task.updatedAt]);

  useEffect(() => {
    if (!initializedRef.current) return;
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setPriority(task.priority);
    setAssigneeId(task.assigneeId ?? null);
    setDueDate(toDateInputValue(task.dueDate));
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
      if (saving) return;

      setSaving(true);
      try {
        const response = await fetch(`/api/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: fields.title ?? title.trim(),
            description:
              fields.description ?? (description.trim() || undefined),
            status: fields.status ?? status,
            priority: fields.priority ?? priority,
            assigneeId:
              fields.assigneeId !== undefined ? fields.assigneeId : assigneeId,
            dueDate: fields.dueDate !== undefined ? fields.dueDate : dueDate,
          }),
        });
        if (!response.ok) throw new Error("Failed to update task");
        const updated: SerializedTask = await response.json();
        setTask(updated);
        await revalidateIssueCaches(queryClient, task.id);
      } finally {
        setSaving(false);
      }
    },
    [
      assigneeId,
      description,
      dueDate,
      priority,
      queryClient,
      saving,
      status,
      task.id,
      title,
    ],
  );

  const handleIssueChange = useCallback(async () => {
    await revalidateIssueCaches(queryClient, task.id);
  }, [queryClient, task.id]);

  useEffect(() => {
    if (!initializedRef.current || !title.trim()) return;
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
  }, [description, save, task.description, task.title, title]);

  async function handlePropertyChange(
    field: "status" | "priority" | "assigneeId" | "dueDate",
    value: Task["status"] | Task["priority"] | string | null,
  ) {
    const previous = { status, priority, assigneeId, dueDate };
    const next = {
      status: field === "status" ? (value as Task["status"]) : status,
      priority: field === "priority" ? (value as Task["priority"]) : priority,
      assigneeId:
        field === "assigneeId" ? (value as string | null) : assigneeId,
      dueDate: field === "dueDate" ? (value as string | null) : dueDate,
    };

    const activity = buildPropertyChangeActivity(
      field,
      previous,
      next,
      { id: user.id, name: user.name },
      members,
    );

    if (field === "status") setStatus(next.status);
    if (field === "priority") setPriority(next.priority);
    if (field === "assigneeId") setAssigneeId(next.assigneeId);
    if (field === "dueDate") setDueDate(next.dueDate);

    if (activity) {
      timeline.appendActivity(activity);
    }

    await save({ [field]: value });
  }

  function handleDeleteClick() {
    setDeleteDialog(isAdmin ? "confirm" : "admin-required");
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete task");
      queryClient.removeQueries({ queryKey: queryKeys.issueDetail(task.id) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
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
              {prevTask ? (
                <IssueDetailLink
                  taskId={prevTask.id}
                  className="inline-flex size-7 items-center justify-center rounded-md hover:bg-white/[0.04] hover:text-foreground"
                >
                  <ChevronUp className="size-3.5" />
                </IssueDetailLink>
              ) : (
                <span className="inline-flex size-7 items-center justify-center opacity-30">
                  <ChevronUp className="size-3.5" />
                </span>
              )}
              {nextTask ? (
                <IssueDetailLink
                  taskId={nextTask.id}
                  className="inline-flex size-7 items-center justify-center rounded-md hover:bg-white/[0.04] hover:text-foreground"
                >
                  <ChevronDown className="size-3.5" />
                </IssueDetailLink>
              ) : (
                <span className="inline-flex size-7 items-center justify-center opacity-30">
                  <ChevronDown className="size-3.5" />
                </span>
              )}
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
              <IssueActivitySection
                taskId={task.id}
                activities={timeline.activities}
                comments={timeline.comments}
                onAddComment={timeline.addComment}
                onRemoveComment={timeline.removeComment}
                onChange={handleIssueChange}
              />
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
