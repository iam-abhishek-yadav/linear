import { TaskListPageClient } from "@/components/list/task-list-page-client";
import { getOrgMembers } from "@/lib/members";
import { logPageRender } from "@/lib/logger";

export default async function ListPage() {
  return logPageRender("list", async () => {
    const members = await getOrgMembers();
    return <TaskListPageClient members={members} />;
  });
}
