"use client";

import { useEffect, useState } from "react";
import type { Member } from "@/lib/members";
import { useMembersCache } from "@/hooks/use-members-cache";

export type { Member };

export function useMembers() {
  return useMembersCache();
}
