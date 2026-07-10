"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { TaskListView } from "@/components/list/task-list-view";
import type { AssignedView } from "@/components/issues/issues-header";
import { useSession } from "@/components/session-provider";
import { useTasks } from "@/hooks/use-tasks";
import type { Member } from "@/lib/members";
import type { TaskStatus } from "@/lib/types";
import {
  filterCompletedArchiveTasks,
  filterMainViewTasks,
} from "@/lib/task-visibility";

function resolveAssignedView(view: string | null): AssignedView {
  if (view === "active" || view === "backlog" || view === "completed") {
    return view;
  }
  return "all";
}

function MyIssuesContent({ members }: { members: Member[] }) {
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
        : assignedView === "completed"
          ? ["DONE"]
          : undefined;

  const visibleTasks =
    assignedView === "completed"
      ? filterCompletedArchiveTasks(myTasks)
      : filterMainViewTasks(myTasks);

  return (
    <TaskListView
      members={members}
      tasks={visibleTasks}
      allTasks={tasks}
      loading={loading}
      filterStatus={filterStatus}
      variant={assignedView === "completed" ? "completed" : "default"}
      emptyMessage={
        assignedView === "completed"
          ? "No completed issues older than a day"
          : "No issues assigned to you"
      }
      tabScope="assigned"
      pageTitle="My issues"
      assignedView={assignedView}
      onCreate={createTask}
      onUpdate={updateTask}
      onDelete={deleteTask}
    />
  );
}

export function MyIssuesPageClient({ members }: { members: Member[] }) {
  return (
    <Suspense fallback={null}>
      <MyIssuesContent members={members} />
    </Suspense>
  );
}
