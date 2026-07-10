import { TaskListPageClient } from "@/components/list/task-list-page-client";
import { getOrgMembers } from "@/lib/members";
import { logPageRender } from "@/lib/logger";

export default async function CompletedPage() {
  return logPageRender("completed", async () => {
    const members = await getOrgMembers();

    return (
      <TaskListPageClient
        members={members}
        variant="completed"
        emptyMessage="No completed issues older than a day"
      />
    );
  });
}
