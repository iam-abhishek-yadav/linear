"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Check, Loader2, Plus } from "lucide-react";
import { TaskDialog } from "@/components/kanban/task-dialog";
import {
  IssuesPageChrome,
  type AssignedView,
  type IssuesTabScope,
} from "@/components/issues/issues-header";
import { useOpenIssue, usePrefetchIssueDetail } from "@/hooks/use-open-issue";
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
import { useViewFilters } from "@/hooks/use-view-filters";
import type { TaskInput } from "@/hooks/use-tasks";
import { useMembersContext } from "@/components/members-provider";
import {
  getPriorityMeta,
  getStatusMeta,
  LIST_STATUS_ORDER,
  PRIORITIES,
} from "@/lib/constants";
import {
  buildTaskIdentifierIndex,
  formatIdentifierFromIndex,
  getProjectKey,
} from "@/lib/task-utils";
import { applyTaskFilters } from "@/lib/task-filters";
import { getTaskCompletedAt } from "@/lib/task-visibility";
import type { Task, TaskPriority, TaskStatus, TaskWithTags } from "@/lib/types";
import { cn } from "@/lib/utils";

type TaskListViewProps = {
  tasks: TaskWithTags[];
  allTasks: TaskWithTags[];
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
  identifierIndex,
  selected,
  onClick,
  onPriorityChange,
}: {
  task: Task;
  identifierIndex: Map<string, number>;
  selected: boolean;
  onClick: () => void;
  onPriorityChange: (priority: TaskPriority) => void;
}) {
  const { organization } = useSession();
  const prefetchIssue = usePrefetchIssueDetail();
  const projectKey = getProjectKey(organization.name);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onPointerEnter={() => prefetchIssue(task.id)}
      onFocus={() => prefetchIssue(task.id)}
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
      <span className="w-[52px] shrink-0 font-mono text-[13px] tracking-tight text-white/30">
        {formatIdentifierFromIndex(identifierIndex, task.id, projectKey)}
      </span>
      <StatusIcon status={task.status} />
      <span className="min-w-0 flex-1 truncate text-[14px] font-normal text-foreground/95">
        {task.title}
      </span>
    </div>
  );
}

function StatusGroup({
  status,
  tasks,
  identifierIndex,
  selectedTaskId,
  onTaskClick,
  onAddIssue,
  onPriorityChange,
}: {
  status: TaskStatus;
  tasks: Task[];
  identifierIndex: Map<string, number>;
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
        <StatusIcon status={status} />
        <span className="text-[14px] text-muted-foreground/75">{meta.label}</span>
        {tasks.length > 0 && (
          <span className="text-[14px] text-muted-foreground/40">
            {tasks.length}
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => onAddIssue(status)}
            className="rounded p-0.5 text-muted-foreground/25 transition-colors hover:bg-white/[0.05] hover:text-muted-foreground/60"
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>
      <div>
        {tasks.map((task) => (
          <IssueRow
            key={task.id}
            task={task}
            identifierIndex={identifierIndex}
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
  tasks,
  allTasks,
  filterStatus,
  emptyMessage = "No issues yet",
  tabScope = "workspace",
  pageTitle = "Issues",
  assignedView = "all",
  variant = "default",
  onCreate,
  onUpdate,
}: TaskListViewProps) {
  const openIssue = useOpenIssue();
  const pathname = usePathname();
  const members = useMembersContext();
  const {
    filters,
    isFiltering,
    select,
    clear,
    togglePriority,
    clearPriorities,
    toggleTag,
    clearTags,
    clearAll,
  } = useViewFilters();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("TODO");
  const selectedTaskId = pathname.match(/^\/issues\/([^/]+)$/)?.[1] ?? null;

  const visible = filterStatus
    ? tasks.filter((t) => filterStatus.includes(t.status))
    : tasks;

  const filtered =
    tabScope === "assigned" ? visible : applyTaskFilters(visible, filters);

  const sorted =
    variant === "completed"
      ? [...filtered].sort((a, b) => {
          const aTime = getTaskCompletedAt(a)?.getTime() ?? 0;
          const bTime = getTaskCompletedAt(b)?.getTime() ?? 0;
          return bTime - aTime;
        })
      : [...filtered].sort((a, b) => {
          const order = filterStatus ?? LIST_STATUS_ORDER;
          const statusOrder = order.indexOf(a.status) - order.indexOf(b.status);
          if (statusOrder !== 0) return statusOrder;
          return a.position - b.position;
        });

  const statusesToShow = filterStatus ?? LIST_STATUS_ORDER;
  const identifierIndex = useMemo(
    () => buildTaskIdentifierIndex(allTasks),
    [allTasks],
  );

  function openCreate(status: TaskStatus = "TODO") {
    setDefaultStatus(status);
    setDialogOpen(true);
  }

  function openTask(task: Task) {
    openIssue(task.id);
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
          filters={filters}
          isFiltering={isFiltering}
          onSelectAssignee={select}
          onClearAssignee={clear}
          onTogglePriority={togglePriority}
          onClearPriorities={clearPriorities}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
          onClearAll={clearAll}
        />

        <main className="flex-1 overflow-y-auto pb-14">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-[14px] text-muted-foreground">{emptyMessage}</p>
              <button
                type="button"
                onClick={() => openCreate("TODO")}
                className="mt-3 text-[14px] text-violet-400 hover:text-violet-300"
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
                  identifierIndex={identifierIndex}
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
              {statusesToShow.map((status) => {
                const statusTasks = sorted.filter((t) => t.status === status);

                return (
                  <StatusGroup
                    key={status}
                    status={status}
                    tasks={statusTasks}
                    identifierIndex={identifierIndex}
                    selectedTaskId={selectedTaskId}
                    onTaskClick={openTask}
                    onAddIssue={openCreate}
                    onPriorityChange={handlePriorityChange}
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultStatus={defaultStatus}
        onSave={async (data) => {
          await onCreate(data);
        }}
      />
    </>
  );
}

function TaskListViewFallback({
  tabScope = "workspace",
  pageTitle = "Issues",
  assignedView = "all",
}: Pick<TaskListViewProps, "tabScope" | "pageTitle" | "assignedView">) {
  const members = useMembersContext();
  const {
    filters,
    isFiltering,
    select,
    clear,
    togglePriority,
    clearPriorities,
    toggleTag,
    clearTags,
    clearAll,
  } = useViewFilters();

  const showFilters = tabScope !== "assigned";

  return (
    <div className="flex flex-1 flex-col">
      <IssuesPageChrome
        scope={tabScope}
        title={pageTitle}
        assignedView={assignedView}
        members={members}
        filters={showFilters ? filters : undefined}
        isFiltering={showFilters && isFiltering}
        onSelectAssignee={showFilters ? select : undefined}
        onClearAssignee={showFilters ? clear : undefined}
        onTogglePriority={showFilters ? togglePriority : undefined}
        onClearPriorities={showFilters ? clearPriorities : undefined}
        onToggleTag={showFilters ? toggleTag : undefined}
        onClearTags={showFilters ? clearTags : undefined}
        onClearAll={showFilters ? clearAll : undefined}
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
        tabScope={props.tabScope}
        pageTitle={props.pageTitle}
        assignedView={props.assignedView}
      />
    );
  }

  return <TaskListViewContent {...props} />;
}
