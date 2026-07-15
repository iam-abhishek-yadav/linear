"use client";

import type { MembersPageData } from "@/lib/members";
import { useMembersStore } from "@/stores/members-store";

export function useMembersPage(initialData?: MembersPageData) {
  const members = useMembersStore((state) => state.members);
  const pendingInvites = useMembersStore((state) => state.pendingInvites);
  const loading = useMembersStore((state) => state.loading);
  const refresh = useMembersStore((state) => state.refresh);

  if (initialData) {
    useMembersStore.getState().hydrate(initialData);
  }

  return {
    data: { members, pendingInvites },
    isPending: loading && members.length === 0,
    refetch: refresh,
  };
}
