"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  defaultDropAnimationSideEffects,
  rectIntersection,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type DropAnimation,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCardContent } from "@/components/kanban/kanban-card";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { BoardPageChrome } from "@/components/issues/board-header";
import { useAssigneeFilter } from "@/hooks/use-assignee-filter";
import type { Member } from "@/lib/members";
import { useTasks } from "@/hooks/use-tasks";
import { COLUMNS } from "@/lib/constants";
import { filterByAssignee } from "@/lib/task-filters";
import {
  countStaleCompletedTasks,
  filterMainViewTasks,
} from "@/lib/task-visibility";
import type { Task, TaskStatus } from "@/lib/types";

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: "0.4",
      },
    },
  }),
};

function groupByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = tasks
        .filter((t) => t.status === col.id)
        .sort((a, b) => a.position - b.position);
      return acc;
    },
    {} as Record<TaskStatus, Task[]>,
  );
}

function resolveOverStatus(overId: string): TaskStatus | undefined {
  const overColumn = COLUMNS.find((c) => c.id === overId);
  return overColumn?.id;
}

function moveTaskInState(
  prev: Task[],
  activeId: string,
  overId: string,
  overStatus: TaskStatus,
): Task[] {
  const activeItem = prev.find((t) => t.id === activeId);
  if (!activeItem) return prev;

  const withoutActive = prev.filter((t) => t.id !== activeId);

  const targetColumn = withoutActive
    .filter((t) => t.status === overStatus)
    .sort((a, b) => a.position - b.position);

  let insertAt = targetColumn.length;
  if (overId !== overStatus) {
    const overIndex = targetColumn.findIndex((t) => t.id === overId);
    if (overIndex !== -1) insertAt = overIndex;
  }

  const movedTask = { ...activeItem, status: overStatus };
  targetColumn.splice(insertAt, 0, movedTask);
  const repositionedTarget = targetColumn.map((t, i) => ({ ...t, position: i }));

  const sourceStatus = activeItem.status;
  const sourceColumn =
    sourceStatus === overStatus
      ? []
      : withoutActive
          .filter((t) => t.status === sourceStatus)
          .sort((a, b) => a.position - b.position)
          .map((t, i) => ({ ...t, position: i }));

  const others = withoutActive.filter(
    (t) => t.status !== overStatus && t.status !== sourceStatus,
  );

  return [...others, ...sourceColumn, ...repositionedTarget];
}

export function KanbanBoard({ members }: { members: Member[] }) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <KanbanBoardContent members={members} />
    </Suspense>
  );
}

function KanbanBoardContent({ members }: { members: Member[] }) {
  const {
    tasks,
    loading,
    setTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    persistReorder,
  } = useTasks();
  const { selectedId, select, clear } = useAssigneeFilter();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const tasksRef = useRef(tasks);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      // Press-and-hold so a normal finger swipe can scroll the column
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  );

  const staleCompletedCount = countStaleCompletedTasks(tasks);
  const visibleTasks = filterByAssignee(
    filterMainViewTasks(tasks),
    selectedId,
  );
  const grouped = groupByStatus(visibleTasks);

  function handleDragStart(event: DragStartEvent) {
    const task = tasksRef.current.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    const overTask = tasksRef.current.find((t) => t.id === overId);
    const overStatus = resolveOverStatus(overId) ?? overTask?.status;
    if (!overStatus) return;

    setTasks((prev) => {
      const activeItem = prev.find((t) => t.id === activeId);
      if (!activeItem) return prev;

      if (activeItem.status === overStatus && overTask) {
        const columnTasks = prev
          .filter((t) => t.status === overStatus)
          .sort((a, b) => a.position - b.position);

        const oldIndex = columnTasks.findIndex((t) => t.id === activeId);
        const newIndex = columnTasks.findIndex((t) => t.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
          return prev;
        }

        const reordered = arrayMove(columnTasks, oldIndex, newIndex).map(
          (t, i) => ({ ...t, position: i }),
        );
        const others = prev.filter((t) => t.status !== overStatus);
        return [...others, ...reordered];
      }

      if (activeItem.status !== overStatus) {
        return moveTaskInState(prev, activeId, overId, overStatus);
      }

      return prev;
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) {
      fetchTasks();
      return;
    }

    const activeId = active.id as string;

    setTasks((current) => {
      const task = current.find((t) => t.id === activeId);
      if (task) {
        persistReorder(activeId, task.status, task.position);
      }
      return current;
    });
  }

  function handleDragCancel() {
    setActiveTask(null);
    fetchTasks();
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <BoardPageChrome
        onNewIssue={() => setNewDialogOpen(true)}
        members={members}
        selectedAssigneeId={selectedId}
        onSelectAssignee={select}
        onClearAssigneeFilter={clear}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={rectIntersection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex w-full overflow-x-auto px-4 pb-4 pt-2">
          <div className="mx-auto flex gap-3">
            {COLUMNS.map((col) => (
              <KanbanColumn
                key={col.id}
                id={col.id}
                label={col.label}
                tasks={grouped[col.id]}
                allTasks={tasks}
                members={members}
                onTaskClick={(task) => {
                  setEditingTask(task);
                  setDialogOpen(true);
                }}
                onCreate={createTask}
                footer={
                  col.id === "DONE" && staleCompletedCount > 0 ? (
                    <Link
                      href="/completed"
                      className="block rounded-md px-2 py-2 text-[12px] text-violet-400 transition-colors hover:bg-white/[0.04] hover:text-violet-300"
                    >
                      {staleCompletedCount} more completed{" "}
                      {staleCompletedCount === 1 ? "issue" : "issues"}
                    </Link>
                  ) : undefined
                }
              />
            ))}
          </div>
        </div>

        <DragOverlay dropAnimation={dropAnimation}>
          {activeTask ? (
            <div className="w-72 rotate-1 shadow-lg">
              <KanbanCardContent
                task={activeTask}
                allTasks={tasks}
                members={members}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <TaskDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        task={editingTask}
        onSave={async (data) => {
          if (editingTask) {
            await updateTask(editingTask.id, data);
          }
        }}
        onDelete={
          editingTask
            ? async () => deleteTask(editingTask.id)
            : undefined
        }
      />

      <TaskDialog
        open={newDialogOpen}
        onOpenChange={setNewDialogOpen}
        defaultStatus="TODO"
        onSave={createTask}
      />
    </>
  );
}
