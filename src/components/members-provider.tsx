"use client";

import type { Member, MemberWithMeta, PendingInvite } from "@/lib/members";
import { useMembersStore } from "@/stores/members-store";

export function MembersProvider({
  members,
  pendingInvites,
  children,
}: {
  members: MemberWithMeta[];
  pendingInvites: PendingInvite[];
  children: React.ReactNode;
}) {
  useMembersStore.getState().hydrate({ members, pendingInvites });
  return children;
}

export function useMembersContext(): Member[] {
  return useMembersStore((state) => state.members);
}
