"use client";

import { TaskListView } from "@/components/list/task-list-view";
import { useTasks } from "@/hooks/use-tasks";

export default function BacklogPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();

  return (
    <TaskListView
      tasks={tasks}
      allTasks={tasks}
      loading={loading}
      filterStatus={["BACKLOG"]}
      emptyMessage="No backlog issues"
      onCreate={createTask}
      onUpdate={updateTask}
      onDelete={deleteTask}
    />
  );
}
