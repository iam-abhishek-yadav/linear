import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export async function revalidateIssueCaches(
  queryClient: QueryClient,
  taskId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.issueDetail(taskId) }),
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks }),
    queryClient.invalidateQueries({ queryKey: queryKeys.notifications }),
  ]);
}
