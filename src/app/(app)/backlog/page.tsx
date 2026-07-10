import { TaskListPageClient } from "@/components/list/task-list-page-client";
import { getOrgMembers } from "@/lib/members";
import { logPageRender } from "@/lib/logger";

export default async function BacklogPage() {
  return logPageRender("backlog", async () => {
    const members = await getOrgMembers();

    return (
      <TaskListPageClient
        members={members}
        filterStatus={["BACKLOG"]}
        emptyMessage="No backlog issues"
      />
    );
  });
}
