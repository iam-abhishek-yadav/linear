"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMembersPage } from "@/lib/api";
import type { MembersPageData } from "@/lib/members";
import { queryKeys } from "@/lib/query-keys";

export function useMembersPage(initialData?: MembersPageData) {
  return useQuery({
    queryKey: queryKeys.orgMembers,
    queryFn: fetchMembersPage,
    initialData,
  });
}
