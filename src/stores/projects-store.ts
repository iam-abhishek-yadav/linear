import { create } from "zustand";
import { fetchProjects } from "@/lib/api";
import type { ProjectSummary } from "@/lib/projects";

type ProjectsState = {
  projects: ProjectSummary[];
  loading: boolean;
  hydrated: boolean;
  hydrate: (projects: ProjectSummary[]) => void;
  setProjects: (projects: ProjectSummary[]) => void;
  upsertProject: (project: ProjectSummary) => void;
  removeProject: (id: string) => void;
  refresh: () => Promise<void>;
};

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  hydrated: false,

  hydrate: (projects) => {
    if (get().hydrated) return;
    set({ projects, loading: false, hydrated: true });
  },

  setProjects: (projects) => {
    set({ projects, loading: false, hydrated: true });
  },

  upsertProject: (project) => {
    set((state) => {
      const exists = state.projects.some((item) => item.id === project.id);
      const projects = exists
        ? state.projects.map((item) =>
            item.id === project.id ? project : item,
          )
        : [...state.projects, project].sort((a, b) =>
            a.name.localeCompare(b.name),
          );
      return { projects, hydrated: true };
    });
  },

  removeProject: (id) => {
    set((state) => ({
      projects: state.projects.filter((project) => project.id !== id),
    }));
  },

  refresh: async () => {
    set({ loading: true });
    try {
      const projects = await fetchProjects();
      set({ projects, loading: false, hydrated: true });
    } catch {
      set({ loading: false });
      throw new Error("Failed to refresh projects");
    }
  },
}));
