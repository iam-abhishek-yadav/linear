"use client";

import { useEffect, useState } from "react";
import type { Member } from "@/lib/members";

export type { Member };

export function useMembers() {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    let active = true;

    fetch("/api/members")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.members) setMembers(data.members);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return members;
}
