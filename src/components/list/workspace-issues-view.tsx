"use client";

import { usePathname } from "next/navigation";
import { TaskListView } from "@/components/list/task-list-view";
import { useTasks } from "@/hooks/use-tasks";
import type { TaskStatus } from "@/lib/types";

type WorkspaceView = "all" | "active" | "backlog" | "completed";

function getWorkspaceView(pathname: string): WorkspaceView {
  if (pathname === "/active") return "active";
  if (pathname === "/backlog") return "backlog";
  if (pathname === "/completed") return "completed";
  return "all";
}

function getViewConfig(view: WorkspaceView) {
  switch (view) {
    case "active":
      return {
        filterStatus: ["IN_PROGRESS", "TODO"] as TaskStatus[],
        emptyMessage: "No issues",
        variant: "default" as const,
      };
    case "backlog":
      return {
        filterStatus: ["BACKLOG"] as TaskStatus[],
        emptyMessage: "No backlog issues",
        variant: "default" as const,
      };
    case "completed":
      return {
        filterStatus: undefined,
        emptyMessage: "No completed issues",
        variant: "completed" as const,
      };
    default:
      return {
        filterStatus: undefined,
        emptyMessage: undefined,
        variant: "default" as const,
      };
  }
}

export function WorkspaceIssuesView() {
  const pathname = usePathname();
  const view = getWorkspaceView(pathname);
  const { filterStatus, emptyMessage, variant } = getViewConfig(view);
  const { tasks, createTask, updateTask, deleteTask } = useTasks();

  const visibleTasks =
    view === "completed"
      ? tasks.filter((task) => task.status === "DONE")
      : tasks;

  return (
    <TaskListView
      tasks={visibleTasks}
      allTasks={tasks}
      loading={false}
      filterStatus={filterStatus}
      emptyMessage={emptyMessage}
      variant={variant}
      onCreate={async (data) => {
        await createTask(data);
      }}
      onUpdate={async (id, data) => {
        await updateTask(id, data);
      }}
      onDelete={deleteTask}
    />
  );
}
