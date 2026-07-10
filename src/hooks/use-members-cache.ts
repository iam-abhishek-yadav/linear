"use client";

import { useEffect, useState } from "react";
import type { Member } from "@/lib/members";
import { useMembersContext } from "@/components/members-provider";

let cachedMembers: Member[] | null = null;
let inflightMembers: Promise<Member[]> | null = null;

async function fetchMembers(): Promise<Member[]> {
  const response = await fetch("/api/members");
  if (!response.ok) return [];
  const data = await response.json();
  return data.members ?? [];
}

export function seedMembersCache(members: Member[]) {
  cachedMembers = members;
}

export function loadMembers(): Promise<Member[]> {
  if (cachedMembers) return Promise.resolve(cachedMembers);
  if (!inflightMembers) {
    inflightMembers = fetchMembers()
      .then((members) => {
        cachedMembers = members;
        return members;
      })
      .finally(() => {
        inflightMembers = null;
      });
  }
  return inflightMembers;
}

export function prefetchMembers() {
  if (!cachedMembers && !inflightMembers) {
    void loadMembers();
  }
}

export function useMembersCache() {
  const contextMembers = useMembersContext();
  const [members, setMembers] = useState<Member[]>(
    contextMembers.length > 0 ? contextMembers : (cachedMembers ?? []),
  );

  useEffect(() => {
    if (contextMembers.length > 0) {
      setMembers(contextMembers);
      return;
    }

    if (cachedMembers) {
      setMembers(cachedMembers);
      return;
    }

    let active = true;
    void loadMembers().then((loaded) => {
      if (active) setMembers(loaded);
    });
    return () => {
      active = false;
    };
  }, [contextMembers]);

  return members.length > 0 ? members : contextMembers;
}

export type { Member };

export function useMembers() {
  return useMembersCache();
}
