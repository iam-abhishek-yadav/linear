import { MyIssuesPageClient } from "@/components/list/my-issues-page-client";
import { getOrgMembers } from "@/lib/members";

export default async function MyIssuesPage() {
  const members = await getOrgMembers();

  return <MyIssuesPageClient members={members} />;
}
