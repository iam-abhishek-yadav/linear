import { create } from "zustand";
import type { TaskStatus, TaskWithTags } from "@/lib/types";
import type { TaskInput } from "@/lib/api";
import {
  createTask as createTaskApi,
  deleteTask as deleteTaskApi,
  fetchTasks,
  reorderTask,
  updateTask as updateTaskApi,
} from "@/lib/api";

type TasksState = {
  tasks: TaskWithTags[];
  loading: boolean;
  hydrated: boolean;
  /** Hydrate from SSR once; later remounts keep client state. */
  hydrate: (tasks: TaskWithTags[]) => void;
  setTasks: (updater: TaskWithTags[] | ((current: TaskWithTags[]) => TaskWithTags[])) => void;
  refresh: () => Promise<void>;
  createTask: (data: TaskInput) => Promise<TaskWithTags>;
  updateTask: (id: string, data: TaskInput) => Promise<TaskWithTags>;
  deleteTask: (id: string) => Promise<void>;
  persistReorder: (
    taskId: string,
    status: TaskStatus,
    position: number,
  ) => Promise<void>;
};

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: true,
  hydrated: false,

  hydrate: (tasks) => {
    if (get().hydrated) return;
    set({ tasks, loading: false, hydrated: true });
  },

  setTasks: (updater) => {
    set((state) => ({
      tasks: typeof updater === "function" ? updater(state.tasks) : updater,
    }));
  },

  refresh: async () => {
    set({ loading: true });
    try {
      const tasks = await fetchTasks();
      set({ tasks, loading: false, hydrated: true });
    } catch {
      set({ loading: false });
      throw new Error("Failed to refresh tasks");
    }
  },

  createTask: async (data) => {
    const task = await createTaskApi(data);
    set((state) => ({ tasks: [...state.tasks, task] }));
    return task;
  },

  updateTask: async (id, data) => {
    const updated = await updateTaskApi(id, data);
    set((state) => ({
      tasks: state.tasks.map((task) => (task.id === updated.id ? updated : task)),
    }));
    return updated;
  },

  deleteTask: async (id) => {
    await deleteTaskApi(id);
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    }));
  },

  persistReorder: async (taskId, status, position) => {
    const snapshot = get().tasks;
    try {
      const updated = await reorderTask({ taskId, status, position });
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === updated.id
            ? { ...updated, tags: updated.tags ?? task.tags ?? [] }
            : task,
        ),
      }));
    } catch (error) {
      set({ tasks: snapshot });
      throw error;
    }
  },
}));
