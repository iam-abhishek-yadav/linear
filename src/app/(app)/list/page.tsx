"use client";

import { TaskListView } from "@/components/list/task-list-view";
import { useTasks } from "@/hooks/use-tasks";

export default function ListPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();

  return (
    <TaskListView
      tasks={tasks}
      allTasks={tasks}
      loading={loading}
      onCreate={createTask}
      onUpdate={updateTask}
      onDelete={deleteTask}
    />
  );
}
