"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { StatusIcon } from "@/components/tasks/status-icon";
import type { Member } from "@/hooks/use-members";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  id: Task["status"];
  label: string;
  tasks: Task[];
  identifierIndex: Map<string, number>;
  members: Member[];
  onTaskClick: (task: Task) => void;
  footer?: React.ReactNode;
};

export function KanbanColumn({
  id,
  label,
  tasks,
  identifierIndex,
  members,
  onTaskClick,
  footer,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column" } });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-2 flex items-center gap-2 px-1">
        <StatusIcon status={id} />
        <h2 className="text-xs font-medium text-muted-foreground">{label}</h2>
        <span className="text-xs text-muted-foreground/60">{tasks.length}</span>
      </div>

      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[calc(100vh-8rem)] flex-1 flex-col rounded-lg border border-white/[0.05] bg-black/20 p-2 transition-colors",
          isOver && "border-white/[0.1] bg-black/30",
        )}
      >
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-hidden">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  identifierIndex={identifierIndex}
                  members={members}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        {footer ? (
          <div className="mt-1.5 flex justify-center">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
