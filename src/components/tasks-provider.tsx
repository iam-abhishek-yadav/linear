"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  createTask as createTaskApi,
  deleteTask as deleteTaskApi,
  fetchTasks,
  reorderTask,
  updateTask as updateTaskApi,
  type TaskInput,
} from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";
import type { TaskStatus, TaskWithTags } from "@/lib/types";

export type { TaskInput };

type TasksContextValue = {
  tasks: TaskWithTags[];
  loading: boolean;
  setTasks: React.Dispatch<React.SetStateAction<TaskWithTags[]>>;
  fetchTasks: () => Promise<void>;
  createTask: (data: TaskInput) => Promise<TaskWithTags>;
  updateTask: (id: string, data: TaskInput) => Promise<TaskWithTags>;
  deleteTask: (id: string) => Promise<void>;
  persistReorder: (
    taskId: string,
    status: TaskStatus,
    position: number,
  ) => Promise<void>;
};

const TasksContext = createContext<TasksContextValue | null>(null);

export function TasksProvider({
  initialTasks,
  children,
}: {
  initialTasks: TaskWithTags[];
  children: ReactNode;
}) {
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: queryKeys.tasks,
    queryFn: fetchTasks,
    initialData: initialTasks,
  });

  const tasks = tasksQuery.data ?? [];

  const fetchTasksFn = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
  }, [queryClient]);

  const setTasks = useCallback(
    (updater: React.SetStateAction<TaskWithTags[]>) => {
      queryClient.setQueryData<TaskWithTags[]>(queryKeys.tasks, (current = []) =>
        typeof updater === "function" ? updater(current) : updater,
      );
    },
    [queryClient],
  );

  const createTaskMutation = useMutation({
    mutationFn: createTaskApi,
    onSuccess: (task) => {
      queryClient.setQueryData<TaskWithTags[]>(queryKeys.tasks, (current = []) => [
        ...current,
        task,
      ]);
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaskInput }) =>
      updateTaskApi(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<TaskWithTags[]>(queryKeys.tasks, (current = []) =>
        current.map((task) => (task.id === updated.id ? updated : task)),
      );
      queryClient.invalidateQueries({
        queryKey: queryKeys.issueDetail(updated.id),
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTaskApi,
    onSuccess: (_result, id) => {
      queryClient.setQueryData<TaskWithTags[]>(queryKeys.tasks, (current = []) =>
        current.filter((task) => task.id !== id),
      );
      queryClient.removeQueries({ queryKey: queryKeys.issueDetail(id) });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: reorderTask,
    onSuccess: (updated) => {
      queryClient.setQueryData<TaskWithTags[]>(queryKeys.tasks, (current = []) =>
        current.map((task) =>
          task.id === updated.id
            ? { ...updated, tags: updated.tags ?? task.tags ?? [] }
            : task,
        ),
      );
    },
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.tasks });
    },
  });

  const value = useMemo<TasksContextValue>(
    () => ({
      tasks,
      loading: tasksQuery.isPending,
      setTasks,
      fetchTasks: fetchTasksFn,
      createTask: (data) => createTaskMutation.mutateAsync(data),
      updateTask: (id, data) => updateTaskMutation.mutateAsync({ id, data }),
      deleteTask: (id) => deleteTaskMutation.mutateAsync(id),
      persistReorder: async (taskId, status, position) => {
        await reorderMutation.mutateAsync({ taskId, status, position });
      },
    }),
    [
      tasks,
      tasksQuery.isPending,
      setTasks,
      fetchTasksFn,
      createTaskMutation,
      updateTaskMutation,
      deleteTaskMutation,
      reorderMutation,
    ],
  );

  return (
    <TasksContext.Provider value={value}>{children}</TasksContext.Provider>
  );
}

export function useTasksContext() {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error("useTasksContext must be used within TasksProvider");
  }
  return context;
}
