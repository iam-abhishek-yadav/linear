import { create } from "zustand";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import type { NotificationItem } from "@/lib/notification-types";
import { NOTIFICATIONS_POLL_MS } from "@/lib/query-keys";

function markRead(
  notifications: NotificationItem[],
  id?: string,
): NotificationItem[] {
  return notifications.map((notification) =>
    !id || notification.id === id
      ? { ...notification, read: true }
      : notification,
  );
}

type NotificationsState = {
  notifications: NotificationItem[];
  loading: boolean;
  hydrated: boolean;
  pollTimer: ReturnType<typeof setInterval> | null;
  hydrate: (notifications: NotificationItem[]) => void;
  setNotifications: (notifications: NotificationItem[]) => void;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
};

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  loading: true,
  hydrated: false,
  pollTimer: null,

  hydrate: (notifications) => {
    if (get().hydrated) return;
    set({ notifications, loading: false, hydrated: true });
  },

  setNotifications: (notifications) => {
    set({ notifications, loading: false, hydrated: true });
  },

  refresh: async () => {
    try {
      const notifications = await fetchNotifications();
      set({ notifications, loading: false, hydrated: true });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    const previous = get().notifications;
    set({ notifications: markRead(previous, id) });
    try {
      await markNotificationRead(id);
    } catch {
      set({ notifications: previous });
      throw new Error("Failed to mark notification read");
    }
  },

  markAllRead: async () => {
    const previous = get().notifications;
    set({ notifications: markRead(previous) });
    try {
      await markAllNotificationsRead();
    } catch {
      set({ notifications: previous });
      throw new Error("Failed to mark all notifications read");
    }
  },

  startPolling: () => {
    if (get().pollTimer) return;
    const pollTimer = setInterval(() => {
      void get().refresh();
    }, NOTIFICATIONS_POLL_MS);
    set({ pollTimer });
  },

  stopPolling: () => {
    const { pollTimer } = get();
    if (pollTimer) {
      clearInterval(pollTimer);
      set({ pollTimer: null });
    }
  },
}));
