import { TaskListPageClient } from "@/components/list/task-list-page-client";
import { getOrgMembers } from "@/lib/members";

export default async function ListPage() {
  const members = await getOrgMembers();

  return <TaskListPageClient members={members} />;
}
