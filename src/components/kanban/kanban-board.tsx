"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
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
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCardContent } from "@/components/kanban/kanban-card";
import { TaskDialog } from "@/components/kanban/task-dialog";
import { BoardPageChrome } from "@/components/issues/board-header";
import { useMembersContext } from "@/components/members-provider";
import { useViewFilters } from "@/hooks/use-view-filters";
import { useTasks } from "@/hooks/use-tasks";
import { COLUMNS } from "@/lib/constants";
import { applyTaskFilters } from "@/lib/task-filters";
import { buildTaskIdentifierIndex } from "@/lib/task-utils";
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

export function KanbanBoard() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <KanbanBoardContent />
    </Suspense>
  );
}

function KanbanBoardContent() {
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

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const tasksRef = useRef(tasks);
  const dragSnapshotRef = useRef<Task[] | null>(null);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      // Press-and-hold so a normal finger swipe can scroll the column
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const staleCompletedCount = countStaleCompletedTasks(tasks);
  const visibleTasks = applyTaskFilters(
    filterMainViewTasks(tasks),
    filters,
  );
  const grouped = groupByStatus(visibleTasks);
  const identifierIndex = useMemo(() => buildTaskIdentifierIndex(tasks), [tasks]);

  function handleDragStart(event: DragStartEvent) {
    const task = tasksRef.current.find((t) => t.id === event.active.id);
    if (task) setActiveTask(task);
    dragSnapshotRef.current = tasksRef.current;
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
    const snapshot = dragSnapshotRef.current;

    setTasks((current) => {
      const task = current.find((t) => t.id === activeId);
      if (task) {
        persistReorder(activeId, task.status, task.position).catch(() => {
          if (snapshot) setTasks(snapshot);
        });
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
                identifierIndex={identifierIndex}
                members={members}
                onTaskClick={(task) => {
                  setEditingTask(task);
                  setDialogOpen(true);
                }}
                footer={
                  col.id === "DONE" && staleCompletedCount > 0 ? (
                    <Link
                      href="/completed"
                      className="block rounded-md px-2 py-2 text-[13px] text-violet-400 transition-colors hover:bg-white/4 hover:text-violet-300"
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
                identifierIndex={identifierIndex}
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
        onSave={async (data) => {
          await createTask(data);
        }}
      />
    </>
  );
}
