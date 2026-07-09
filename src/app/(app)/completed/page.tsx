"use client";

import { TaskListView } from "@/components/list/task-list-view";
import { filterCompletedArchiveTasks } from "@/lib/task-visibility";
import { useTasks } from "@/hooks/use-tasks";

export default function CompletedPage() {
  const { tasks, loading, createTask, updateTask, deleteTask } = useTasks();

  return (
    <TaskListView
      tasks={filterCompletedArchiveTasks(tasks)}
      allTasks={tasks}
      loading={loading}
      variant="completed"
      emptyMessage="No completed issues older than a day"
      onCreate={createTask}
      onUpdate={updateTask}
      onDelete={deleteTask}
    />
  );
}
