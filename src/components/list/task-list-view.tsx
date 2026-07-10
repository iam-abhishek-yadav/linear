"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, Loader2, Plus } from "lucide-react";
import { TaskDialog } from "@/components/kanban/task-dialog";
import {
  IssuesPageChrome,
  type AssignedView,
  type IssuesTabScope,
} from "@/components/issues/issues-header";
import { useSession } from "@/components/session-provider";
import { PriorityIcon } from "@/components/tasks/priority-icon";
import { StatusIcon } from "@/components/tasks/status-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAssigneeFilter } from "@/hooks/use-assignee-filter";
import type { TaskInput } from "@/hooks/use-tasks";
import type { Member } from "@/lib/members";
import {
  getPriorityMeta,
  getStatusMeta,
  LIST_STATUS_ORDER,
  PRIORITIES,
} from "@/lib/constants";
import { formatTaskIdentifier, getProjectKey } from "@/lib/task-utils";
import { filterByAssignee } from "@/lib/task-filters";
import {
  countStaleCompletedTasks,
  filterMainViewTasks,
  getTaskCompletedAt,
} from "@/lib/task-visibility";
import type { Task, TaskPriority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskListViewProps = {
  members: Member[];
  tasks: Task[];
  allTasks: Task[];
  loading: boolean;
  filterStatus?: TaskStatus[];
  emptyMessage?: string;
  tabScope?: IssuesTabScope;
  pageTitle?: string;
  assignedView?: AssignedView;
  variant?: "default" | "completed";
  onCreate: (data: TaskInput) => Promise<void>;
  onUpdate: (id: string, data: TaskInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

function ListPriorityButton({
  priority,
  onChange,
}: {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors",
              "hover:bg-white/[0.06] hover:text-muted-foreground",
              priority !== "NONE" && "text-muted-foreground/80",
            )}
            aria-label="Set priority"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
        }
      >
        <PriorityIcon priority={priority} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44" sideOffset={4}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Set priority…
          </DropdownMenuLabel>
          {PRIORITIES.map((p) => (
            <DropdownMenuItem
              key={p.id}
              onClick={(e) => {
                e.stopPropagation();
                onChange(p.id);
              }}
            >
              <PriorityIcon priority={p.id} />
              <span className="flex-1">{getPriorityMeta(p.id).label}</span>
              {priority === p.id && (
                <Check className="size-3.5 text-muted-foreground" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function IssueRow({
  task,
  allTasks,
  selected,
  onClick,
  onPriorityChange,
}: {
  task: Task;
  allTasks: Task[];
  selected: boolean;
  onClick: () => void;
  onPriorityChange: (priority: TaskPriority) => void;
}) {
  const { organization } = useSession();
  const projectKey = getProjectKey(organization.name);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        "group flex h-9 w-full cursor-pointer items-center gap-2.5 pr-5 pl-3 text-left transition-colors",
        selected ? "bg-white/[0.05]" : "hover:bg-white/[0.035]",
      )}
    >
      <ListPriorityButton
        priority={task.priority}
        onChange={onPriorityChange}
      />
      <span className="w-[52px] shrink-0 font-mono text-[12px] tracking-tight text-white/30">
        {formatTaskIdentifier(task, allTasks, projectKey)}
      </span>
      <StatusIcon status={task.status} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-normal text-foreground/95">
        {task.title}
      </span>
    </div>
  );
}

function StatusGroup({
  status,
  tasks,
  allTasks,
  selectedTaskId,
  onTaskClick,
  onAddIssue,
  onPriorityChange,
}: {
  status: TaskStatus;
  tasks: Task[];
  allTasks: Task[];
  selectedTaskId: string | null;
  onTaskClick: (task: Task) => void;
  onAddIssue: (status: TaskStatus) => void;
  onPriorityChange: (task: Task, priority: TaskPriority) => void;
}) {
  const meta = getStatusMeta(status);

  if (tasks.length === 0) return null;

  return (
    <section className="border-t border-white/[0.05] first:border-t-0">
      <div className="group/header flex h-9 items-center gap-2 bg-white/[0.025] px-5">
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
            onPriorityChange={(priority) => onPriorityChange(task, priority)}
          />
        ))}
      </div>
    </section>
  );
}

function TaskListViewContent({
  members,
  tasks,
  allTasks,
  loading,
  filterStatus,
  emptyMessage = "No issues yet",
  tabScope = "workspace",
  pageTitle = "Issues",
  assignedView = "all",
  variant = "default",
  onCreate,
  onUpdate,
  onDelete,
}: TaskListViewProps) {
  const { selectedId, select, clear } = useAssigneeFilter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO");

  const staleCompletedCount = countStaleCompletedTasks(allTasks);
  const completedHref =
    tabScope === "assigned" ? "/my-issues?view=completed" : "/completed";

  const scopedTasks =
    variant === "completed" ? tasks : filterMainViewTasks(tasks);

  const visible = filterStatus
    ? scopedTasks.filter((t) => filterStatus.includes(t.status))
    : scopedTasks;

  const assigneeFiltered =
    tabScope === "assigned"
      ? visible
      : filterByAssignee(visible, selectedId);

  const sorted =
    variant === "completed"
      ? [...assigneeFiltered].sort((a, b) => {
          const aTime = getTaskCompletedAt(a)?.getTime() ?? 0;
          const bTime = getTaskCompletedAt(b)?.getTime() ?? 0;
          return bTime - aTime;
        })
      : [...assigneeFiltered].sort((a, b) => {
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

  async function handlePriorityChange(task: Task, priority: TaskPriority) {
    if (task.priority === priority) return;
    await onUpdate(task.id, {
      title: task.title,
      description: task.description ?? undefined,
      status: task.status,
      priority,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 10)
        : null,
    });
  }

  return (
    <>
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <IssuesPageChrome
          scope={tabScope}
          title={pageTitle}
          assignedView={assignedView}
          members={members}
          selectedAssigneeId={selectedId}
          onSelectAssignee={select}
          onClearAssigneeFilter={clear}
        />

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
          ) : variant === "completed" ? (
            <div className="pt-1">
              {sorted.map((task) => (
                <IssueRow
                  key={task.id}
                  task={task}
                  allTasks={allTasks}
                  selected={selectedTaskId === task.id}
                  onClick={() => openTask(task)}
                  onPriorityChange={(priority) =>
                    handlePriorityChange(task, priority)
                  }
                />
              ))}
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
                  onPriorityChange={handlePriorityChange}
                />
              ))}
              {staleCompletedCount > 0 && (
                <div className="border-t border-white/[0.05] px-5 py-3">
                  <Link
                    href={completedHref}
                    className="text-[13px] text-violet-400 transition-colors hover:text-violet-300"
                  >
                    {staleCompletedCount} more completed{" "}
                    {staleCompletedCount === 1 ? "issue" : "issues"}
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
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

function TaskListViewFallback({
  members,
  tabScope = "workspace",
  pageTitle = "Issues",
  assignedView = "all",
}: Pick<TaskListViewProps, "members" | "tabScope" | "pageTitle" | "assignedView">) {
  const { selectedId, select, clear } = useAssigneeFilter();

  return (
    <div className="flex flex-1 flex-col">
      <IssuesPageChrome
        scope={tabScope}
        title={pageTitle}
        assignedView={assignedView}
        members={members}
        selectedAssigneeId={tabScope === "assigned" ? null : selectedId}
        onSelectAssignee={tabScope === "assigned" ? undefined : select}
        onClearAssigneeFilter={tabScope === "assigned" ? undefined : clear}
      />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    </div>
  );
}

export function TaskListView(props: TaskListViewProps) {
  if (props.loading) {
    return (
      <TaskListViewFallback
        members={props.members}
        tabScope={props.tabScope}
        pageTitle={props.pageTitle}
        assignedView={props.assignedView}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <TaskListViewFallback
          members={props.members}
          tabScope={props.tabScope}
          pageTitle={props.pageTitle}
          assignedView={props.assignedView}
        />
      }
    >
      <TaskListViewContent {...props} />
    </Suspense>
  );
}
