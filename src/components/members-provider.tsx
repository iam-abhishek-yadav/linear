"use client";

import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { fetchMembersPage } from "@/lib/api";
import type { Member } from "@/lib/members";
import { queryKeys } from "@/lib/query-keys";

const MembersContext = createContext<Member[]>([]);

export function MembersProvider({
  members,
  children,
}: {
  members: Member[];
  children: React.ReactNode;
}) {
  const membersQuery = useQuery({
    queryKey: queryKeys.orgMembers,
    queryFn: async () => {
      const data = await fetchMembersPage();
      return data.members;
    },
    initialData: members,
  });

  return (
    <MembersContext.Provider value={membersQuery.data ?? members}>
      {children}
    </MembersContext.Provider>
  );
}

export function useMembersContext() {
  return useContext(MembersContext);
}
