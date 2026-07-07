"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock } from "lucide-react";
import { useSession } from "@/components/session-provider";
import { PriorityIcon } from "@/components/tasks/priority-icon";
import type { Member } from "@/hooks/use-members";
import {
  formatDueDate,
  formatTaskIdentifier,
  getProjectKey,
  isOverdue,
} from "@/lib/task-utils";
import type { Task } from "@/lib/types";
import { getAvatarColor, getInitials } from "@/lib/user-utils";
import { cn } from "@/lib/utils";

type KanbanCardContentProps = {
  task: Task;
  allTasks?: Task[];
  members?: Member[];
  onClick?: () => void;
};

export function KanbanCardContent({
  task,
  allTasks = [],
  members = [],
  onClick,
}: KanbanCardContentProps) {
  const { organization } = useSession();
  const projectKey = getProjectKey(organization.name);
  const assignee = members.find((m) => m.id === task.assigneeId) ?? null;
  const dueLabel = formatDueDate(task.dueDate);
  const overdue = isOverdue(task.dueDate);

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#1a1a1a] px-3 py-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.4)] transition-colors hover:border-white/[0.14] hover:bg-[#1f1f1f]">
      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
        tabIndex={onClick ? 0 : -1}
      >
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-muted-foreground/80">
            {allTasks.length > 0
              ? formatTaskIdentifier(task, allTasks, projectKey)
              : projectKey}
          </span>
          <PriorityIcon priority={task.priority} />
        </div>
        <p className="text-[13px] font-medium leading-snug text-foreground">
          {task.title}
        </p>
        {task.description && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {task.description}
          </p>
        )}
        <div className="mt-2.5 flex items-center justify-between gap-2">
          {dueLabel ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px]",
                overdue ? "text-red-400" : "text-muted-foreground/60",
              )}
            >
              <CalendarClock className="size-3" />
              {dueLabel}
            </span>
          ) : (
            <span />
          )}
          {assignee && (
            <span
              className={cn(
                "flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold text-white",
                getAvatarColor(assignee.name),
              )}
              title={assignee.name}
            >
              {getInitials(assignee.name)}
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

type KanbanCardProps = {
  task: Task;
  allTasks?: Task[];
  members?: Member[];
  onClick: () => void;
};

export function KanbanCard({ task, allTasks, members, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: "task", task } });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0.35 : 1,
      }}
      className="touch-none cursor-grab active:cursor-grabbing"
      {...attributes}
      {...listeners}
    >
      <KanbanCardContent
        task={task}
        allTasks={allTasks}
        members={members}
        onClick={onClick}
      />
    </div>
  );
}
