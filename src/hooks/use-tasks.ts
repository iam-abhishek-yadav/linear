"use client";

import { useCallback, useEffect, useState } from "react";
import type { Task, TaskStatus } from "@/lib/types";

export type TaskInput = {
  title: string;
  description?: string;
  status: Task["status"];
  priority: Task["priority"];
  assigneeId?: string | null;
  dueDate?: string | null;
};

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (data: TaskInput) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create task");
    const task = await res.json();
    if (!task?.id) throw new Error("Malformed task response");
    setTasks((prev) => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback(async (id: string, data: TaskInput) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update task");
    const updated = await res.json();
    if (!updated?.id) throw new Error("Malformed task response");
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    return updated;
  }, []);

  const deleteTask = useCallback(async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const persistReorder = useCallback(
    async (taskId: string, status: TaskStatus, position: number) => {
      try {
        const res = await fetch("/api/tasks/reorder", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, status, position }),
        });
        if (!res.ok) throw new Error("Reorder failed");
        const updated = await res.json();
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      } catch {
        await fetchTasks();
      }
    },
    [fetchTasks],
  );

  return {
    tasks,
    loading,
    setTasks,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    persistReorder,
  };
}
