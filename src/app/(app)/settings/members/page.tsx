import { redirect } from "next/navigation";
import { MembersPage } from "@/components/settings/members-page";
import { requireMemberManager } from "@/lib/auth";
import { getMembersPageData } from "@/lib/members";

export default async function MembersSettingsPage() {
  const session = await requireMemberManager();

  if (!session) {
    redirect("/settings/profile");
  }

  const { members, pendingInvites } = await getMembersPageData();

  return (
    <MembersPage
      initialMembers={members}
      initialPendingInvites={pendingInvites}
    />
  );
}
