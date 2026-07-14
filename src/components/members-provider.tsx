"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, useMemo } from "react";
import { fetchMembersPage } from "@/lib/api";
import type { Member, MemberWithMeta, PendingInvite } from "@/lib/members";
import { queryKeys } from "@/lib/query-keys";

const MembersContext = createContext<Member[]>([]);

export function MembersProvider({
  members,
  pendingInvites,
  children,
}: {
  members: MemberWithMeta[];
  pendingInvites: PendingInvite[];
  children: React.ReactNode;
}) {
  const membersQuery = useQuery({
    queryKey: queryKeys.orgMembers,
    queryFn: fetchMembersPage,
    initialData: { members, pendingInvites },
  });

  const value = useMemo(
    () => membersQuery.data?.members ?? members,
    [membersQuery.data, members],
  );

  return (
    <MembersContext.Provider value={value}>{children}</MembersContext.Provider>
  );
}

export function useMembersContext() {
  return useContext(MembersContext);
}
