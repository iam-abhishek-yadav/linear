import { TaskListPageClient } from "@/components/list/task-list-page-client";

export default function CompletedPage() {
  return (
    <TaskListPageClient
      variant="completed"
      emptyMessage="No completed issues older than a day"
    />
  );
}
