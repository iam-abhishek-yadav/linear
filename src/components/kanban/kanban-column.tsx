"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { NewTaskButton } from "@/components/kanban/task-dialog";
import { StatusIcon } from "@/components/tasks/status-icon";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

type KanbanColumnProps = {
  id: Task["status"];
  label: string;
  tasks: Task[];
  allTasks: Task[];
  onTaskClick: (task: Task) => void;
  onCreate: (data: {
    title: string;
    description?: string;
    status: Task["status"];
    priority: Task["priority"];
  }) => Promise<void>;
};

export function KanbanColumn({
  id,
  label,
  tasks,
  allTasks,
  onTaskClick,
  onCreate,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { type: "column" } });

  return (
    <div className="flex w-64 shrink-0 flex-col">
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
        <div className="min-h-0 flex-1 overflow-y-auto">
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {tasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  allTasks={allTasks}
                  onClick={() => onTaskClick(task)}
                />
              ))}
            </div>
          </SortableContext>
        </div>

        <div className="mt-1.5">
          <NewTaskButton status={id} onCreate={onCreate} />
        </div>
      </div>
    </div>
  );
}
