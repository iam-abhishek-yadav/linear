"use client";

import { useEffect } from "react";
import { useProjectsStore } from "@/stores/projects-store";

/** Read projects from Zustand; fetch once if the store is empty. */
export function useProjects() {
  const projects = useProjectsStore((state) => state.projects);
  const loading = useProjectsStore((state) => state.loading);
  const hydrated = useProjectsStore((state) => state.hydrated);
  const refresh = useProjectsStore((state) => state.refresh);

  useEffect(() => {
    if (!hydrated && !loading) {
      void refresh();
    }
  }, [hydrated, loading, refresh]);

  return {
    projects,
    loading: loading && !hydrated,
    refresh,
  };
}
