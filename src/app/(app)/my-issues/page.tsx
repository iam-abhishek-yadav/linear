"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { TaskListView } from "@/components/list/task-list-view";
import { useSession } from "@/components/session-provider";
import { useTasks } from "@/hooks/use-tasks";
import type { AssignedView } from "@/components/issues/issues-header";
import type { TaskStatus } from "@/lib/types";

function resolveAssignedView(view: string | null): AssignedView {
  if (view === "active" || view === "backlog") return view;
  return "all";
}

function MyIssuesContent() {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const assignedView = resolveAssignedView(searchParams.get("view"));
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();

  const myTasks = useMemo(
    () => tasks.filter((task) => task.assigneeId === user.id),
    [tasks, user.id],
  );

  const filterStatus: TaskStatus[] | undefined =
    assignedView === "active"
      ? ["IN_PROGRESS", "TODO"]
      : assignedView === "backlog"
        ? ["BACKLOG"]
        : undefined;

  return (
    <TaskListView
      tasks={myTasks}
      allTasks={tasks}
      loading={loading}
      filterStatus={filterStatus}
      emptyMessage="No issues assigned to you"
      tabScope="assigned"
      pageTitle="My issues"
      assignedView={assignedView}
      onCreate={createTask}
      onUpdate={updateTask}
      onDelete={deleteTask}
    />
  );
}

export default function MyIssuesPage() {
  return (
    <Suspense fallback={null}>
      <MyIssuesContent />
    </Suspense>
  );
}
