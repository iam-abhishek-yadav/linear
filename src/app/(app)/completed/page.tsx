import { TaskListPageClient } from "@/components/list/task-list-page-client";
import { getOrgMembers } from "@/lib/members";

export default async function CompletedPage() {
  const members = await getOrgMembers();

  return (
    <TaskListPageClient
      members={members}
      variant="completed"
      emptyMessage="No completed issues older than a day"
    />
  );
}
