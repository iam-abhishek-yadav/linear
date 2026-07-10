"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchIssueDetail } from "@/lib/api";
import { queryKeys } from "@/lib/query-keys";

export function useIssueDetail(taskId: string) {
  const query = useQuery({
    queryKey: queryKeys.issueDetail(taskId),
    queryFn: () => fetchIssueDetail(taskId),
    enabled: Boolean(taskId),
  });

  const error =
    query.isError
      ? ("failed" as const)
      : query.isSuccess && query.data === null
        ? ("not_found" as const)
        : null;

  return {
    data: query.data ?? null,
    loading: query.isPending,
    isFetching: query.isFetching,
    error,
    refetch: query.refetch,
  };
}
