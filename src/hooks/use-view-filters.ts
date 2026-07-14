"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TaskPriority } from "@/db/schema";
import {
  EMPTY_VIEW_FILTERS,
  hasActiveViewFilters,
  parseViewFilters,
  serializeAssigneeFilter,
  serializePriorityFilter,
  serializeTagFilter,
  type ViewFilters,
} from "@/lib/task-filters";

function writeViewFiltersToParams(
  current: URLSearchParams,
  filters: ViewFilters,
) {
  const params = new URLSearchParams(current.toString());

  const assignee = serializeAssigneeFilter(filters.assigneeId);
  if (assignee) params.set("assignee", assignee);
  else params.delete("assignee");

  const priority = serializePriorityFilter(filters.priorities);
  if (priority) params.set("priority", priority);
  else params.delete("priority");

  const tag = serializeTagFilter(filters.tagIds);
  if (tag) params.set("tag", tag);
  else params.delete("tag");

  params.delete("viewId");

  return params;
}

export function useViewFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () =>
      parseViewFilters({
        assignee: searchParams.get("assignee"),
        priority: searchParams.get("priority"),
        tag: searchParams.get("tag"),
      }),
    [searchParams],
  );

  const replaceFilters = useCallback(
    (next: ViewFilters) => {
      const params = writeViewFiltersToParams(searchParams, next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const patchFilters = useCallback(
    (patch: Partial<ViewFilters>) => {
      replaceFilters({
        ...filters,
        ...patch,
      });
    },
    [filters, replaceFilters],
  );

  const setAssigneeId = useCallback(
    (assigneeId: string | null) => {
      patchFilters({ assigneeId });
    },
    [patchFilters],
  );

  const selectAssignee = useCallback(
    (id: string) => setAssigneeId(id),
    [setAssigneeId],
  );

  const clearAssignee = useCallback(() => {
    setAssigneeId(null);
  }, [setAssigneeId]);

  const togglePriority = useCallback(
    (priority: TaskPriority) => {
      const exists = filters.priorities.includes(priority);
      const priorities = exists
        ? filters.priorities.filter((item) => item !== priority)
        : [...filters.priorities, priority];
      patchFilters({ priorities });
    },
    [filters.priorities, patchFilters],
  );

  const clearPriorities = useCallback(() => {
    patchFilters({ priorities: [] });
  }, [patchFilters]);

  const toggleTag = useCallback(
    (tagId: string) => {
      const exists = filters.tagIds.includes(tagId);
      const tagIds = exists
        ? filters.tagIds.filter((item) => item !== tagId)
        : [...filters.tagIds, tagId];
      patchFilters({ tagIds });
    },
    [filters.tagIds, patchFilters],
  );

  const clearTags = useCallback(() => {
    patchFilters({ tagIds: [] });
  }, [patchFilters]);

  const clearAll = useCallback(() => {
    replaceFilters(EMPTY_VIEW_FILTERS);
  }, [replaceFilters]);

  return {
    filters,
    isFiltering: hasActiveViewFilters(filters),
    selectedId: filters.assigneeId,
    select: selectAssignee,
    clear: clearAssignee,
    setAssigneeId,
    togglePriority,
    clearPriorities,
    toggleTag,
    clearTags,
    clearAll,
    replaceFilters,
  };
}

/** @deprecated Prefer useViewFilters — kept for gradual migration alias. */
export function useAssigneeFilter() {
  return useViewFilters();
}
