import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";
import { useNotificationsStore } from "@/stores/notifications-store";
import { useTasksStore } from "@/stores/tasks-store";

export async function revalidateIssueCaches(
  queryClient: QueryClient,
  taskId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: queryKeys.issueDetail(taskId) }),
    useTasksStore.getState().refresh().catch(() => undefined),
    useNotificationsStore.getState().refresh(),
  ]);
}
