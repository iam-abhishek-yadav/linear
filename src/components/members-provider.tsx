"use client";

import { createContext, useContext } from "react";
import type { Member } from "@/lib/members";
import { seedMembersCache } from "@/hooks/use-members-cache";

const MembersContext = createContext<Member[]>([]);

export function MembersProvider({
  members,
  children,
}: {
  members: Member[];
  children: React.ReactNode;
}) {
  seedMembersCache(members);

  return (
    <MembersContext.Provider value={members}>{children}</MembersContext.Provider>
  );
}

export function useMembersContext() {
  return useContext(MembersContext);
}
