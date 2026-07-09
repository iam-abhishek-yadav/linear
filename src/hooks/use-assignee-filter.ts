"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  parseAssigneeFilter,
  serializeAssigneeFilter,
} from "@/lib/task-filters";

export function useAssigneeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedId = useMemo(
    () => parseAssigneeFilter(searchParams.get("assignee")),
    [searchParams],
  );

  const setSelectedId = useCallback(
    (id: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      const serialized = serializeAssigneeFilter(id);
      if (serialized) {
        params.set("assignee", serialized);
      } else {
        params.delete("assignee");
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const select = useCallback(
    (id: string) => {
      setSelectedId(id);
    },
    [setSelectedId],
  );

  const clear = useCallback(() => {
    setSelectedId(null);
  }, [setSelectedId]);

  const isFiltering = selectedId !== null;

  return {
    selectedId,
    select,
    clear,
    isFiltering,
    setSelectedId,
  };
}
