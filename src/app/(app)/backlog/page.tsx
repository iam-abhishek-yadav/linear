import { TaskListPageClient } from "@/components/list/task-list-page-client";

export default function BacklogPage() {
  return (
    <TaskListPageClient
      filterStatus={["BACKLOG"]}
      emptyMessage="No backlog issues"
    />
  );
}
