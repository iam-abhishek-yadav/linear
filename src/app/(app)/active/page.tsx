import { TaskListPageClient } from "@/components/list/task-list-page-client";
import { getOrgMembers } from "@/lib/members";
import { logPageRender } from "@/lib/logger";

export default async function ActivePage() {
  return logPageRender("active", async () => {
    const members = await getOrgMembers();

    return (
      <TaskListPageClient
        members={members}
        filterStatus={["IN_PROGRESS", "TODO"]}
        emptyMessage="No issues"
      />
    );
  });
}
