import { TaskListPageClient } from "@/components/list/task-list-page-client";

export default function ActivePage() {
  return (
    <TaskListPageClient
      filterStatus={["IN_PROGRESS", "TODO"]}
      emptyMessage="No issues"
    />
  );
}
