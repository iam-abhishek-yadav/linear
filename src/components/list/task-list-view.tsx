"use client";

import { useState } from "react";
import {
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Plus,
  Sparkles,
} from "lucide-react";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { IssuesPageChrome } from "@/components/issues/issues-header";
import { StatusIcon } from "@/components/tasks/status-icon";
import { getStatusMeta, LIST_STATUS_ORDER } from "@/lib/constants";
import { formatTaskDate, formatTaskIdentifier } from "@/lib/task-utils";
import type { Task, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskListViewProps = {
  tasks: Task[];
  allTasks: Task[];
  loading: boolean;
  filterStatus?: TaskStatus[];
  emptyMessage?: string;
  onCreate: (data: {
    title: string;
    description?: string;
    status: Task["status"];
    priority: Task["priority"];
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: {
      title: string;
      description?: string;
      status: Task["status"];
      priority: Task["priority"];
    },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function IssueRow({
  task,
  allTasks,
  selected,
  onClick,
}: {
  task: Task;
  allTasks: Task[];
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex h-9 w-full items-center gap-2.5 pr-5 pl-9 text-left transition-colors",
        selected ? "bg-white/[0.05]" : "hover:bg-white/[0.035]",
      )}
    >
      <MoreHorizontal className="absolute left-3 size-3.5 text-muted-foreground/0 transition-colors group-hover:text-muted-foreground/40" />
      <span className="w-[46px] shrink-0 font-mono text-[12px] tracking-tight text-white/30">
        {formatTaskIdentifier(task, allTasks)}
      </span>
      <StatusIcon status={task.status} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-normal text-foreground/95">
        {task.title}
      </span>
      <span className="size-4 shrink-0 rounded-full bg-white/[0.06] ring-1 ring-white/[0.08]" />
      <span className="w-[42px] shrink-0 text-right text-[12px] tabular-nums text-white/30">
        {formatTaskDate(task.updatedAt)}
      </span>
    </button>
  );
}

function StatusGroup({
  status,
  tasks,
  allTasks,
  selectedTaskId,
  onTaskClick,
  onAddIssue,
}: {
  status: TaskStatus;
  tasks: Task[];
  allTasks: Task[];
  selectedTaskId: string | null;
  onTaskClick: (task: Task) => void;
  onAddIssue: (status: TaskStatus) => void;
}) {
  const meta = getStatusMeta(status);

  if (tasks.length === 0) return null;

  return (
    <section className="border-t border-white/[0.05] first:border-t-0">
      <div className="group/header flex h-9 items-center gap-2 bg-white/[0.015] px-5">
        <ChevronDown className="size-3 text-muted-foreground/35" />
        <StatusIcon status={status} />
        <span className="text-[13px] text-muted-foreground/75">{meta.label}</span>
        <span className="text-[13px] text-muted-foreground/40">{tasks.length}</span>
        <button
          type="button"
          onClick={() => onAddIssue(status)}
          className="ml-auto rounded p-0.5 text-muted-foreground/25 transition-colors hover:bg-white/[0.05] hover:text-muted-foreground/60"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div>
        {tasks.map((task) => (
          <IssueRow
            key={task.id}
            task={task}
            allTasks={allTasks}
            selected={selectedTaskId === task.id}
            onClick={() => onTaskClick(task)}
          />
        ))}
      </div>
    </section>
  );
}

export function TaskListView({
  tasks,
  allTasks,
  loading,
  filterStatus,
  emptyMessage = "No issues yet",
  onCreate,
  onUpdate,
  onDelete,
}: TaskListViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO");

  const visible = filterStatus
    ? tasks.filter((t) => filterStatus.includes(t.status))
    : tasks;

  const sorted = [...visible].sort((a, b) => {
    const order = filterStatus ?? LIST_STATUS_ORDER;
    const statusOrder = order.indexOf(a.status) - order.indexOf(b.status);
    if (statusOrder !== 0) return statusOrder;
    return a.position - b.position;
  });

  const statusesToShow = filterStatus ?? LIST_STATUS_ORDER;

  function openCreate(status: TaskStatus = "TODO") {
    setEditingTask(null);
    setDefaultStatus(status);
    setDialogOpen(true);
  }

  function openTask(task: Task) {
    setSelectedTaskId(task.id);
    setEditingTask(task);
    setDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <IssuesPageChrome />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <IssuesPageChrome />

        <main className="flex-1 overflow-y-auto pb-14">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[13px] text-muted-foreground">{emptyMessage}</p>
              <button
                type="button"
                onClick={() => openCreate("TODO")}
                className="mt-3 text-[13px] text-violet-400 hover:text-violet-300"
              >
                Create an issue
              </button>
            </div>
          ) : (
            <div className="pt-1">
              {statusesToShow.map((status) => (
                <StatusGroup
                  key={status}
                  status={status}
                  tasks={sorted.filter((t) => t.status === status)}
                  allTasks={allTasks}
                  selectedTaskId={selectedTaskId}
                  onTaskClick={openTask}
                  onAddIssue={openCreate}
                />
              ))}
            </div>
          )}
        </main>

        <div className="pointer-events-none absolute right-5 bottom-4">
          <button
            type="button"
            className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-white/[0.07] bg-[#141414]/95 px-3 py-1.5 text-[12px] text-muted-foreground/70 backdrop-blur-sm hover:bg-white/[0.05] hover:text-muted-foreground"
          >
            <Sparkles className="size-3.5 opacity-70" />
            Ask Linear
          </button>
        </div>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        defaultStatus={defaultStatus}
        onSave={async (data) => {
          if (editingTask) {
            await onUpdate(editingTask.id, data);
          } else {
            await onCreate(data);
          }
        }}
        onDelete={
          editingTask ? async () => onDelete(editingTask.id) : undefined
        }
      />
    </>
  );
}
