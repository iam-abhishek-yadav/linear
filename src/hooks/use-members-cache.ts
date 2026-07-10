"use client";

import { useMembersContext } from "@/components/members-provider";
import type { Member } from "@/lib/members";

export function useMembersCache() {
  return useMembersContext();
}

export type { Member };

export function useMembers() {
  return useMembersCache();
}
