"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, type ReactNode } from "react";
import type { TaskInput } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useTasksStore } from "@/stores/tasks-store";
import type { TaskStatus, TaskWithTags } from "@/lib/types";

export type { TaskInput };

export function TasksProvider({
  initialTasks,
  children,
}: {
  initialTasks: TaskWithTags[];
  children: ReactNode;
}) {
  useTasksStore.getState().hydrate(initialTasks);
  return children;
}

export function useTasksContext() {
  const queryClient = useQueryClient();
  const tasks = useTasksStore((state) => state.tasks);
  const loading = useTasksStore((state) => state.loading);
  const setTasks = useTasksStore((state) => state.setTasks);
  const refresh = useTasksStore((state) => state.refresh);

  const createTask = useCallback(
    async (data: TaskInput) => {
      const task = await useTasksStore.getState().createTask(data);
      void useNotificationsStore.getState().refresh();
      return task;
    },
    [],
  );

  const updateTask = useCallback(
    async (id: string, data: TaskInput) => {
      const updated = await useTasksStore.getState().updateTask(id, data);
      void queryClient.invalidateQueries({
        queryKey: queryKeys.issueDetail(updated.id),
      });
      void useNotificationsStore.getState().refresh();
      return updated;
    },
    [queryClient],
  );

  const deleteTask = useCallback(async (id: string) => {
    await useTasksStore.getState().deleteTask(id);
    queryClient.removeQueries({ queryKey: queryKeys.issueDetail(id) });
  }, [queryClient]);

  const persistReorder = useCallback(
    async (taskId: string, status: TaskStatus, position: number) => {
      await useTasksStore.getState().persistReorder(taskId, status, position);
      void useNotificationsStore.getState().refresh();
    },
    [],
  );

  return {
    tasks,
    loading,
    setTasks,
    fetchTasks: refresh,
    createTask,
    updateTask,
    deleteTask,
    persistReorder,
  };
}
