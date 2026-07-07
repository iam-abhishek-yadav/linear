"use client";

import { useEffect, useState } from "react";

export type Member = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  isCurrentUser: boolean;
};

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
