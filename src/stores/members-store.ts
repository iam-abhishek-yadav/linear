import { create } from "zustand";
import { fetchMembersPage } from "@/lib/api";
import type { Member, MemberWithMeta, PendingInvite } from "@/lib/members";

type MembersState = {
  members: MemberWithMeta[];
  pendingInvites: PendingInvite[];
  loading: boolean;
  hydrated: boolean;
  hydrate: (data: {
    members: MemberWithMeta[];
    pendingInvites: PendingInvite[];
  }) => void;
  setMembersPage: (data: {
    members: MemberWithMeta[];
    pendingInvites: PendingInvite[];
  }) => void;
  refresh: () => Promise<void>;
};

export const useMembersStore = create<MembersState>((set, get) => ({
  members: [],
  pendingInvites: [],
  loading: true,
  hydrated: false,

  hydrate: (data) => {
    if (get().hydrated) return;
    set({
      members: data.members,
      pendingInvites: data.pendingInvites,
      loading: false,
      hydrated: true,
    });
  },

  setMembersPage: (data) => {
    set({
      members: data.members,
      pendingInvites: data.pendingInvites,
      loading: false,
      hydrated: true,
    });
  },

  refresh: async () => {
    set({ loading: true });
    try {
      const data = await fetchMembersPage();
      set({
        members: data.members,
        pendingInvites: data.pendingInvites,
        loading: false,
        hydrated: true,
      });
    } catch {
      set({ loading: false });
      throw new Error("Failed to refresh members");
    }
  },
}));

/** Member list shape used by assignee pickers (drops createdAt). */
export function selectMembersForPickers(state: MembersState): Member[] {
  return state.members;
}
