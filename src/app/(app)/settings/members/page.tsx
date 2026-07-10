import { MembersPage } from "@/components/settings/members-page";
import { getMembersPageData } from "@/lib/members";

export default async function MembersSettingsPage() {
  const { members, pendingInvites } = await getMembersPageData();

  return (
    <MembersPage
      initialMembers={members}
      initialPendingInvites={pendingInvites}
    />
  );
}
