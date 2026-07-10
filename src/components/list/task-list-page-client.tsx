"use client";

import { TaskListView } from "@/components/list/task-list-view";
import type { AssignedView, IssuesTabScope } from "@/components/issues/issues-header";
import { useTasks } from "@/hooks/use-tasks";
import { filterCompletedArchiveTasks } from "@/lib/task-visibility";
import type { TaskStatus } from "@/lib/types";

type TaskListPageClientProps = {
  filterStatus?: TaskStatus[];
  emptyMessage?: string;
  tabScope?: IssuesTabScope;
  pageTitle?: string;
  assignedView?: AssignedView;
  variant?: "default" | "completed";
};

export function TaskListPageClient({
  filterStatus,
  emptyMessage,
  tabScope,
  pageTitle,
  assignedView,
  variant,
}: TaskListPageClientProps) {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();
  const visibleTasks =
    variant === "completed" ? filterCompletedArchiveTasks(tasks) : tasks;

  return (
    <TaskListView
      tasks={visibleTasks}
      allTasks={tasks}
      loading={loading}
      filterStatus={filterStatus}
      emptyMessage={emptyMessage}
      tabScope={tabScope}
      pageTitle={pageTitle}
      assignedView={assignedView}
      variant={variant}
      onCreate={createTask}
      onUpdate={updateTask}
      onDelete={deleteTask}
    />
  );
}
