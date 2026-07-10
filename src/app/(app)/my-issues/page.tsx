import { MyIssuesPageClient } from "@/components/list/my-issues-page-client";
import { getOrgMembers } from "@/lib/members";
import { logPageRender } from "@/lib/logger";

export default async function MyIssuesPage() {
  return logPageRender("my-issues", async () => {
    const members = await getOrgMembers();
    return <MyIssuesPageClient members={members} />;
  });
}
